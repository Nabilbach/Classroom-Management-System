const express = require('express');
const router = express.Router();
const { AdminScheduleEntry } = require('../models');

// GET all admin schedule entries
router.get('/', async (req, res) => {
  try {
    const entries = await AdminScheduleEntry.findAll();
    res.json(entries);
  } catch (error) {
    console.error('Error fetching admin schedule entries:', error);
    res.status(500).json({ message: 'Failed to fetch admin schedule entries' });
  }
});

// GET a single admin schedule entry by ID
router.get('/:id', async (req, res) => {
  try {
    const entry = await AdminScheduleEntry.findByPk(req.params.id);
    if (entry) {
      res.json(entry);
    } else {
      res.status(404).json({ message: 'Admin schedule entry not found' });
    }
  } catch (error) {
    console.error('Error fetching admin schedule entry:', error);
    res.status(500).json({ message: 'Failed to fetch admin schedule entry' });
  }
});

// POST a new admin schedule entry
router.post('/', async (req, res) => {
  try {
    console.log('🔧 [AdminSchedule] POST payload:', req.body);
    const { id, day, startTime, duration, sectionId, subject, teacher, classroom, sessionType } = req.body;
    const newEntry = await AdminScheduleEntry.create({
      id: id || Date.now().toString(), // Use provided ID or generate a new one
      day, startTime, duration, sectionId, subject, teacher, classroom, sessionType
    });
    res.status(201).json(newEntry);
  } catch (error) {
    console.error('Error creating admin schedule entry:', error);
    res.status(500).json({ message: 'Failed to create admin schedule entry' });
  }
});

// PUT (update) an admin schedule entry
router.put('/:id', async (req, res) => {
  try {
    console.log(`🔧 [AdminSchedule] PUT id=${req.params.id} payload:`, req.body);
    const [updated] = await AdminScheduleEntry.update(req.body, {
      where: { id: req.params.id }
    });
    if (updated) {
      const updatedEntry = await AdminScheduleEntry.findByPk(req.params.id);
      res.json(updatedEntry);
    } else {
      res.status(404).json({ message: 'Admin schedule entry not found' });
    }
  } catch (error) {
    console.error('Error updating admin schedule entry:', error);
    res.status(500).json({ message: 'Failed to update admin schedule entry' });
  }
});

// DELETE all admin schedule entries
router.delete('/all', async (req, res) => {
  try {
    await AdminScheduleEntry.destroy({
      where: {},
      truncate: true // This is faster for deleting all records
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting all admin schedule entries:', error);
    res.status(500).json({ message: 'Failed to delete all admin schedule entries' });
  }
});

// DELETE an admin schedule entry
router.delete('/:id', async (req, res) => {
  try {
    console.log(`🔧 [AdminSchedule] DELETE id=${req.params.id}`);
    const deleted = await AdminScheduleEntry.destroy({
      where: { id: req.params.id }
    });
    if (deleted) {
      res.status(204).send(); // No content
    } else {
      res.status(404).json({ message: 'Admin schedule entry not found' });
    }
  } catch (error) {
    console.error('Error deleting admin schedule entry:', error);
    res.status(500).json({ message: 'Failed to delete admin schedule entry' });
  }
});

module.exports = router;