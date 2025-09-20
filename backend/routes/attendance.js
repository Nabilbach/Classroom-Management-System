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
