const express = require('express');
const router = express.Router();
const ScheduledLesson = require('../models/scheduledLesson');

// GET all scheduled lessons
router.get('/', async (req, res) => {
  try {
    const lessons = await ScheduledLesson.findAll();
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST a new scheduled lesson
router.post('/', async (req, res) => {
  try {
    const lesson = await ScheduledLesson.create(req.body);
    res.status(201).json(lesson);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update a scheduled lesson
router.put('/:id', async (req, res) => {
  try {
    console.log('🔧 [Backend] PUT /scheduled-lessons/:id - Request Body:', req.body); // ADD THIS LINE
    const lesson = await ScheduledLesson.findByPk(req.params.id);
    if (!lesson) return res.status(404).json({ error: 'Scheduled lesson not found' });
    await lesson.update(req.body);
    res.json(lesson);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE a scheduled lesson
router.delete('/:id', async (req, res) => {
  try {
    const lesson = await ScheduledLesson.findByPk(req.params.id);
    if (!lesson) return res.status(404).json({ error: 'Scheduled lesson not found' });
    await lesson.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE all scheduled lessons
router.delete('/all', async (req, res) => {
  try {
    await ScheduledLesson.destroy({ truncate: true });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
