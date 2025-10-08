const express = require('express');
const router = express.Router();
const { TextbookEntry, sequelize } = require('../models');
const { Op } = require('sequelize');

// GET all textbook entries with optional filtering
router.get('/', async (req, res) => {
  try {
    const { sectionId, dateFrom, dateTo, teacherSignature } = req.query;
    
    // بناء شروط البحث
    const whereConditions = {};
    
    if (sectionId && sectionId !== 'all') {
      whereConditions.sectionId = sectionId;
    }
    
    if (dateFrom || dateTo) {
      whereConditions.date = {};
      if (dateFrom) {
        whereConditions.date[Op.gte] = dateFrom;
      }
      if (dateTo) {
        whereConditions.date[Op.lte] = dateTo;
      }
    }
    
    if (teacherSignature) {
      whereConditions.teacherSignature = {
        [Op.like]: `%${teacherSignature}%`
      };
    }
    
    const entries = await TextbookEntry.findAll({
      where: whereConditions,
      order: [['date', 'DESC'], ['startTime', 'ASC']]
    });
    
    res.json(entries);
  } catch (error) {
    console.error('Error fetching textbook entries:', error);
    res.status(500).json({ message: 'Failed to fetch textbook entries' });
  }
});

module.exports = router;