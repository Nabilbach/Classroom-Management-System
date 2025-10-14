const express = require('express');
const router = express.Router();
const { Attendance, Student, Section } = require('../models');

// Helper function to find section by name
async function findSectionByName(sectionName) {
  try {
    const section = await Section.findOne({ where: { name: sectionName } });
    return section;
  } catch (error) {
    console.error('Error finding section:', error);
    return null;
  }
}

// POST /api/attendance - Record attendance for multiple students
router.post('/', async (req, res) => {
  try {
    const { attendance } = req.body;

    if (!attendance) {
      return res.status(400).json({ 
        success: false,
        message: 'البيانات مفقودة: يجب إرسال حقل attendance',
        error: 'Missing attendance field in request body' 
      });
    }

    if (!Array.isArray(attendance)) {
      return res.status(400).json({ 
        success: false,
        message: 'صيغة البيانات غير صحيحة: يجب أن يكون attendance مصفوفة',
        error: 'Invalid data format: expected attendance to be an array' 
      });
    }

    if (attendance.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'لا توجد بيانات للحفظ',
        error: 'Empty attendance array' 
      });
    }

    const results = [];
    const errors = [];
    for (const raw of attendance) {
      try {
        // Coerce/validate fields
        const studentId = Number(raw.studentId);
        if (!Number.isFinite(studentId)) {
          throw new Error(`Invalid studentId: ${raw.studentId}`);
        }

        let sectionId = raw.sectionId;
        if (sectionId === undefined || sectionId === null) {
          throw new Error('sectionId is required');
        }
        // Resolve section by name if not an existing ID
        if (typeof sectionId === 'string') {
          // First, try by primary key (supports string IDs like 'TCS-1')
          const byPk = await Section.findByPk(sectionId);
          if (byPk) {
            sectionId = byPk.id;
          } else if (/\D/.test(sectionId)) {
            // Fallback: if contains non-digits, try by name
            const section = await findSectionByName(sectionId);
            if (!section) throw new Error(`Section "${sectionId}" not found`);
            sectionId = section.id;
          }
        } else if (typeof sectionId === 'number') {
          // IDs are strings in Sections table
          sectionId = String(sectionId);
        } else {
          sectionId = String(sectionId);
        }

        // Normalize date to YYYY-MM-DD
        const date = (raw.date || new Date().toISOString().split('T')[0]).slice(0, 10);
        const isPresent = Boolean(raw.isPresent);

        // Resolve student and ensure section consistency: attendance.sectionId MUST match the student's assigned section
        const student = await Student.findByPk(studentId);
        if (!student) throw new Error(`Student with id ${studentId} not found`);
        // Student model uses snake_case DB column `section_id`; defensive access
        const studentSectionId = student.section_id ?? student.sectionId ?? (student.get ? student.get('section_id') : undefined);
        if (!studentSectionId) {
          throw new Error(`Student ${studentId} does not have an assigned section`);
        }

        // Find existing by unique key (studentId + date). If exists, update; else create.
        // IMPORTANT: Do not silently overwrite an existing record's sectionId.
        // Changing sectionId on an existing attendance must be explicit (forceSectionUpdate=true)
        const existing = await Attendance.findOne({ where: { studentId, date } });
        if (existing) {
          const forceSectionUpdate = raw.forceSectionUpdate === true || raw.forceSectionUpdate === 'true';

          // If an attempt is made to change sectionId, require explicit forceSectionUpdate
          if (String(existing.sectionId) !== String(sectionId)) {
            if (!forceSectionUpdate) {
              // Reject the change - do NOT silently overwrite. Log for auditing.
              console.error('Rejected attendance POST: attempted to change sectionId on existing record without forceSectionUpdate', { attendanceId: existing.id, studentId, date, existingSectionId: existing.sectionId, attemptedSectionId: sectionId });
              errors.push({ record: raw, error: 'Attempt to change sectionId on existing attendance without forceSectionUpdate' });
              continue; // skip to next record
            }
            // If forceSectionUpdate present, ensure the requested section matches the student's assigned section
            if (String(sectionId) !== String(studentSectionId)) {
              console.error('Rejected attendance POST: forceSectionUpdate provided but attempted section does not match student assigned section', { studentId, date, attemptedSectionId: sectionId, studentSectionId });
              errors.push({ record: raw, error: 'Requested sectionId does not match student assigned section even with forceSectionUpdate' });
              continue;
            }
          }

          // Allowed: either sectionId same as existing, or forceSectionUpdate granted and matches student's section
          existing.sectionId = sectionId;
          existing.isPresent = isPresent;
          await existing.save();
          results.push(existing.toJSON ? existing.toJSON() : existing);
        } else {
          // For new records: ensure the provided sectionId matches the student's assigned section
          if (String(sectionId) !== String(studentSectionId)) {
            console.error('Rejected attendance POST: new attendance sectionId mismatch with student assigned section', { studentId, date, attemptedSectionId: sectionId, studentSectionId });
            errors.push({ record: raw, error: 'Attendance sectionId does not match student assigned section' });
            continue; // skip creating this record
          }

          const created = await Attendance.create({ studentId, sectionId, date, isPresent });
          results.push(created.toJSON ? created.toJSON() : created);
        }
      } catch (e) {
        console.error('Attendance record failed:', { raw, error: e?.message });
        errors.push({ record: raw, error: e?.message });
      }
    }

    if (errors.length > 0 && results.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'فشل حفظ جميع سجلات الحضور',
        error: 'No attendance records saved', 
        errors,
        details: errors.map(e => e.error).join(', ')
      });
    }
    // Return both successes and failures for visibility
    res.status(errors.length ? 207 : 201).json({ 
      success: true,
      message: errors.length ? 'تم حفظ بعض السجلات مع وجود أخطاء' : 'تم حفظ جميع السجلات بنجاح',
      saved: results.length, 
      errors, 
      records: results.map(r => r.toJSON?.() || r) 
    });
  } catch (error) {
    console.error('Error saving attendance (fatal):', error);
    res.status(500).json({ 
      success: false,
      message: 'خطأ في الخادم: فشل حفظ الحضور', 
      error: error.message, 
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
});

// GET /api/attendance?date=2025-04-05&sectionId=5 - Fetch attendance for a specific day or all records
router.get('/', async (req, res) => {
  let { date, sectionId } = req.query;
  
  try {
    // Build where clause based on provided parameters
    const whereClause = {};
    if (date) whereClause.date = date;
    if (sectionId) {
      // Handle section name to ID conversion
      if (isNaN(sectionId)) {
        const section = await findSectionByName(sectionId);
        if (!section) {
          return res.status(400).json({ 
            success: false,
            message: `القسم "${sectionId}" غير موجود`,
            error: `Section "${sectionId}" not found` 
          });
        }
        whereClause.sectionId = section.id;
      } else {
        whereClause.sectionId = sectionId;
      }
    }

    const records = await Attendance.findAll({
      where: whereClause,
      include: [{
        model: Student,
        as: 'student',
        attributes: [
          'id', // Also include id
          ['first_name', 'firstName'],
          ['last_name', 'lastName'],
          ['class_order', 'classOrder'],
          ['pathway_number', 'pathwayNumber']
        ]
      }],
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });

    // Add absence count for each student
    const recordsWithAbsences = await Promise.all(records.map(async (record) => {
      const absenceCount = await Attendance.count({
        where: {
          studentId: record.studentId,
          isPresent: false
        }
      });
      
      return {
        ...record.toJSON(),
        absences: absenceCount
      };
    }));

    res.json({
      success: true,
      count: recordsWithAbsences.length,
      records: recordsWithAbsences
    });
  } catch (error) {
    console.error('Error in GET /api/attendance:', error);
    res.status(500).json({ 
      success: false,
      message: 'خطأ في جلب بيانات الحضور',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// DELETE /api/attendance - Delete attendance records
// Query params:
// - ?date=YYYY-MM-DD&sectionId=ID : Delete attendance for a specific day/section
// - ?deleteAll=true : Delete all attendance records  
// - Body: {student_id, date, section_id} : Delete specific student attendance
router.delete('/', async (req, res) => {
  try {
    let { date, sectionId, deleteAll } = req.query;
    const body = req.body || {};
  // Accept multiple possible names from various clients (body or query)
  const student_id = body.student_id ?? body.studentId ?? body.student ?? body.studentid ?? undefined;
  const qStudentId = req.query.student_id ?? req.query.studentId ?? req.query.student ?? req.query.studentid ?? undefined;
  const effectiveStudentId = student_id ?? qStudentId;
    const section_id = body.section_id ?? body.sectionId ?? body.section ?? body.sectionid ?? body.section_id;
    // Allow callers to provide `date` in the request body for student-specific deletes
    const bodyDate = body.date ?? body.Date ?? body.DATE ? String(body.date || body.Date || body.DATE).slice(0, 10) : undefined;
    // Prefer query `date` but fall back to bodyDate for single-student deletes
    const effectiveDate = date ? String(date).slice(0, 10) : bodyDate;

    // Log inputs to help diagnose mismatched shapes from frontend
    console.log('DELETE /api/attendance incoming', { query: req.query, body: body });
    
    // Handle delete specific student attendance (accept date from body or query, and accept student id in body or query)
    if (effectiveStudentId && effectiveDate) {
      console.log(`🗑️ Request to delete attendance for student ${effectiveStudentId} on ${effectiveDate}`);
      
      const whereClause = { 
        studentId: effectiveStudentId,
        date: effectiveDate
      };
      
      // Prefer explicit body section_id, fall back to query sectionId
      const effectiveSection = section_id || sectionId;
      if (effectiveSection) {
        whereClause.sectionId = effectiveSection;
      }
      
      const deletedCount = await Attendance.destroy({ where: whereClause });
      
      console.log(`✅ Deleted ${deletedCount} attendance record(s) for student ${effectiveStudentId}`);
      
      return res.json({ 
        success: true,
        message: deletedCount > 0 ? 'تم حذف سجل الحضور بنجاح' : 'لم يتم العثور على سجلات للحذف',
        deletedCount 
      });
    }
    
    // Handle delete all records
    if (deleteAll === 'true') {
      console.log('🗑️ Request to delete all attendance records received');
      
      // First, check if there are any records
      const totalRecords = await Attendance.count();
      console.log(`📊 Found ${totalRecords} attendance records to delete`);
      
      if (totalRecords === 0) {
        return res.json({ 
          message: 'No attendance records found to delete',
          deletedCount: 0 
        });
      }

      const deletedCount = await Attendance.destroy({
        where: {} // Delete all records
      });
      
      console.log(`✅ Successfully deleted ${deletedCount} attendance records`);
      
      return res.json({ 
        message: `Successfully deleted ${deletedCount} attendance records`,
        deletedCount 
      });
    }
    
    // Handle delete by date/section (date may have come from query or earlier bodyDate fallback)
    if (!effectiveDate) {
      return res.status(400).json({ 
        success: false,
        message: 'التاريخ مطلوب لحذف سجلات الحضور',
        error: 'date parameter is required' 
      });
    }

    // Normalize date to YYYY-MM-DD (defensive)
    date = String(effectiveDate).slice(0, 10);

    const whereClause = { date };

    // Only filter by section if sectionId is provided
    if (typeof sectionId !== 'undefined' && sectionId !== null && String(sectionId).trim() !== '') {
      // Resolve section by name if necessary
      try {
        if (isNaN(sectionId)) {
          const section = await findSectionByName(sectionId);
          if (!section) return res.status(400).json({ message: `Section "${sectionId}" not found` });
          sectionId = section.id;
        }
        // Ensure sectionId is a string (model stores IDs as strings in many places)
        sectionId = String(sectionId);
        whereClause.sectionId = sectionId;
      } catch (e) {
        console.error('Error resolving sectionId for deletion:', e);
        return res.status(500).json({ message: 'Failed to resolve sectionId', error: e.message });
      }
    }

    // Log the delete action for debugging
    console.log('Deleting attendance records with whereClause:', whereClause);

    const deletedCount = await Attendance.destroy({ where: whereClause });
    return res.json({ 
      success: true,
      message: `تم حذف ${deletedCount} سجل حضور بنجاح`,
      deletedCount 
    });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    res.status(500).json({ 
      success: false,
      message: 'خطأ في حذف سجلات الحضور',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});


// GET /api/attendance/:id - Get a specific attendance record by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        message: 'رقم سجل الحضور غير صحيح',
        error: 'Valid attendance record ID is required' 
      });
    }

    const record = await Attendance.findByPk(id, {
      include: [{
        model: Student,
        as: 'student',
        attributes: [
          'id',
          ['first_name', 'firstName'],
          ['last_name', 'lastName'],
          ['class_order', 'classOrder'],
          ['pathway_number', 'pathwayNumber']
        ]
      }, {
        model: Section,
        attributes: ['id', 'name', 'educationalLevel']
      }]
    });

    if (!record) {
      return res.status(404).json({ 
        success: false,
        message: 'سجل الحضور غير موجود',
        error: 'Attendance record not found' 
      });
    }

    // Add absence count for the student
    const absenceCount = await Attendance.count({
      where: {
        studentId: record.studentId,
        isPresent: false
      }
    });

    const recordWithAbsences = {
      ...record.toJSON(),
      absences: absenceCount
    };

    res.json({
      success: true,
      record: recordWithAbsences
    });
  } catch (error) {
    console.error('Error fetching attendance record by ID:', error);
    res.status(500).json({ 
      success: false,
      message: 'خطأ في جلب سجل الحضور',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// PUT /api/attendance/:id - Update a specific attendance record
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { isPresent, sectionId, date } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        message: 'رقم سجل الحضور غير صحيح',
        error: 'Valid attendance record ID is required' 
      });
    }

    // Find the existing record
    const record = await Attendance.findByPk(id);
    if (!record) {
      return res.status(404).json({ 
        success: false,
        message: 'سجل الحضور غير موجود',
        error: 'Attendance record not found' 
      });
    }

    // Validate and prepare update data
    const updateData = {};

    if (isPresent !== undefined) {
      updateData.isPresent = Boolean(isPresent);
    }

    if (sectionId !== undefined) {
      let validSectionId = sectionId;
      
      // Resolve section by name if necessary
      if (typeof sectionId === 'string' && isNaN(sectionId)) {
        const section = await findSectionByName(sectionId);
        if (!section) {
          return res.status(400).json({ 
            success: false,
            message: `القسم "${sectionId}" غير موجود`,
            error: `Section "${sectionId}" not found` 
          });
        }
        validSectionId = section.id;
      }
      updateData.sectionId = validSectionId;
    }

    if (date !== undefined) {
      // Normalize date to YYYY-MM-DD format
      const normalizedDate = date.slice(0, 10);
      
      // Check if another record exists for the same student on the new date
      if (normalizedDate !== record.date) {
        const existing = await Attendance.findOne({
          where: { 
            studentId: record.studentId, 
            date: normalizedDate,
            id: { [require('sequelize').Op.ne]: id } // Exclude current record
          }
        });
        
        if (existing) {
          return res.status(409).json({ 
            success: false,
            message: 'يوجد سجل حضور آخر لهذا الطالب في نفس التاريخ',
            error: 'Attendance record already exists for this student on the specified date' 
          });
        }
      }
      updateData.date = normalizedDate;
    }

    // Update the record
    await record.update(updateData);

    // Fetch the updated record with associations
    const updatedRecord = await Attendance.findByPk(id, {
      include: [{
        model: Student,
        as: 'student',
        attributes: [
          'id',
          ['first_name', 'firstName'],
          ['last_name', 'lastName'],
          ['class_order', 'classOrder'],
          ['pathway_number', 'pathwayNumber']
        ]
      }, {
        model: Section,
        attributes: ['id', 'name', 'educationalLevel']
      }]
    });

    // Add absence count
    const absenceCount = await Attendance.count({
      where: {
        studentId: updatedRecord.studentId,
        isPresent: false
      }
    });

    const recordWithAbsences = {
      ...updatedRecord.toJSON(),
      absences: absenceCount
    };

    res.json({
      success: true,
      message: 'تم تحديث سجل الحضور بنجاح',
      record: recordWithAbsences
    });

  } catch (error) {
    console.error('Error updating attendance record:', error);
    res.status(500).json({ 
      success: false,
      message: 'خطأ في تحديث سجل الحضور',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// DELETE /api/attendance/:id - Delete a specific attendance record
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        message: 'رقم سجل الحضور غير صحيح',
        error: 'Valid attendance record ID is required' 
      });
    }

    const record = await Attendance.findByPk(id);
    if (!record) {
      return res.status(404).json({ 
        success: false,
        message: 'سجل الحضور غير موجود',
        error: 'Attendance record not found' 
      });
    }

    await record.destroy();
    
    res.json({ 
      success: true,
      message: 'تم حذف سجل الحضور بنجاح',
      deletedRecord: {
        id: record.id,
        studentId: record.studentId,
        date: record.date,
        isPresent: record.isPresent
      }
    });
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    res.status(500).json({ 
      success: false,
      message: 'خطأ في حذف سجل الحضور',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
