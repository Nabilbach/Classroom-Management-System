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

    if (!Array.isArray(attendance)) {
      return res.status(400).json({ message: 'Invalid data format: expected attendance[]' });
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

        // Find existing by unique key (studentId + date). If exists, update; else create
        const existing = await Attendance.findOne({ where: { studentId, date } });
        if (existing) {
          existing.sectionId = sectionId;
          existing.isPresent = isPresent;
          await existing.save();
          results.push(existing);
        } else {
          const created = await Attendance.create({ studentId, sectionId, date, isPresent });
          results.push(created);
        }
      } catch (e) {
        console.error('Attendance record failed:', { raw, error: e?.message });
        errors.push({ record: raw, error: e?.message });
      }
    }

    if (errors.length > 0 && results.length === 0) {
      return res.status(400).json({ message: 'No attendance records saved', errors });
    }
    // Return both successes and failures for visibility
    res.status(errors.length ? 207 : 201).json({ saved: results.length, errors, records: results.map(r => r.toJSON?.() || r) });
  } catch (error) {
    console.error('Error saving attendance (fatal):', error);
    res.status(500).json({ message: 'Failed to save attendance', error: error.message, stack: error.stack });
  }
});

// GET /api/attendance?date=2025-04-05&sectionId=5 - Fetch attendance for a specific day
router.get('/', async (req, res) => {
  let { date, sectionId } = req.query;
  
  try {
    // Handle section name to ID conversion
    if (sectionId && isNaN(sectionId)) {
      const section = await findSectionByName(sectionId);
      if (!section) {
        return res.status(400).json({ message: `Section "${sectionId}" not found` });
      }
      sectionId = section.id;
    }

    const records = await Attendance.findAll({
      where: { date, sectionId },
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

    res.json(recordsWithAbsences);
  } catch (error) {
    console.error('Error in GET /api/attendance:', error);
    res.status(500).json({ message: 'Error fetching attendance' });
  }
});

// DELETE /api/attendance?date=YYYY-MM-DD&sectionId=ID - Delete attendance for a specific day/section
router.delete('/', async (req, res) => {
  try {
    let { date, sectionId } = req.query;
    if (!date || !sectionId) {
      return res.status(400).json({ message: 'Both date and sectionId are required' });
    }

    // Resolve section by name if necessary
    if (sectionId && isNaN(sectionId)) {
      const section = await findSectionByName(sectionId);
      if (!section) return res.status(400).json({ message: `Section "${sectionId}" not found` });
      sectionId = section.id;
    }

    const deletedCount = await Attendance.destroy({ where: { date, sectionId } });
    return res.json({ message: 'Attendance records deleted', deletedCount });
  } catch (error) {
    console.error('Error deleting day attendance:', error);
    res.status(500).json({ message: 'Failed to delete attendance for the day' });
  }
});

// GET /api/attendance/:id - Get a specific attendance record by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'Valid attendance record ID is required' });
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
      return res.status(404).json({ message: 'Attendance record not found' });
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

    res.json(recordWithAbsences);
  } catch (error) {
    console.error('Error fetching attendance record by ID:', error);
    res.status(500).json({ 
      message: 'Error fetching attendance record', 
      error: error.message 
    });
  }
});

// PUT /api/attendance/:id - Update a specific attendance record
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { isPresent, sectionId, date } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'Valid attendance record ID is required' });
    }

    // Find the existing record
    const record = await Attendance.findByPk(id);
    if (!record) {
      return res.status(404).json({ message: 'Attendance record not found' });
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
          return res.status(400).json({ message: `Section "${sectionId}" not found` });
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
            message: 'Attendance record already exists for this student on the specified date' 
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
      message: 'Attendance record updated successfully',
      record: recordWithAbsences
    });

  } catch (error) {
    console.error('Error updating attendance record:', error);
    res.status(500).json({ 
      message: 'Error updating attendance record', 
      error: error.message 
    });
  }
});

// DELETE /api/attendance/:id - Delete a specific attendance record
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'Valid attendance record ID is required' });
    }

    const record = await Attendance.findByPk(id);
    if (!record) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    await record.destroy();
    
    res.json({ 
      message: 'Attendance record deleted successfully',
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
      message: 'Error deleting attendance record', 
      error: error.message 
    });
  }
});

// DELETE /api/attendance/all - Delete all attendance records
router.delete('/all', async (req, res) => {
  try {
    const deletedCount = await Attendance.destroy({
      where: {} // Delete all records
    });
    
    res.json({ 
      message: `Deleted ${deletedCount} attendance records`,
      deletedCount 
    });
  } catch (error) {
    console.error('Error deleting all attendance records:', error);
    res.status(500).json({ message: 'Failed to delete attendance records' });
  }
});

module.exports = router;
