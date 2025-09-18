const express = require('express');
const router = express.Router();
const { Attendance, Student } = require('../models');

// POST /api/attendance - Record attendance for multiple students
router.post('/', async (req, res) => {
  try {
    const { attendance } = req.body;

    if (!Array.isArray(attendance)) {
      return res.status(400).json({ message: 'Invalid data format' });
    }

    const recordsToUpsert = attendance.map(record => ({
      studentId: record.studentId,
      sectionId: record.sectionId,
      date: record.date,
      isPresent: record.isPresent,
    }));

    // Sequelize's bulkCreate with updateOnDuplicate is perfect for this
    const savedRecords = await Attendance.bulkCreate(recordsToUpsert, {
      updateOnDuplicate: ['isPresent'], // Update isPresent field if a record for the same student and date exists
    });

    res.status(201).json(savedRecords);
  } catch (error) {
    console.error('Error saving attendance:', error);
    res.status(500).json({ message: 'Failed to save attendance' });
  }
});

// GET /api/attendance?date=2025-04-05&sectionId=5 - Fetch attendance for a specific day
router.get('/', async (req, res) => {
  const { date, sectionId } = req.query;
  try {
    const records = await Attendance.findAll({
      where: { date, sectionId },
      include: [{
        model: Student,
        as: 'student',
        attributes: [
          'id', // Also include id
          ['first_name', 'firstName'],
          ['last_name', 'lastName']
        ]
      }],
    });
    res.json(records);
  } catch (error) {
    console.error('Error in GET /api/attendance:', error);
    res.status(500).json({ message: 'Error fetching attendance' });
  }
});

module.exports = router;
