const express = require('express');
const router = express.Router();
const { Curriculum, CurriculumItem } = require('../models');

// GET all curriculums
router.get('/', async (req, res) => {
  try {
    const curriculums = await Curriculum.findAll({
      include: [{ model: CurriculumItem, as: 'items' }],
      order: [['createdAt', 'DESC']]
    });
    res.json(curriculums);
  } catch (error) {
    console.error('Error fetching curriculums:', error);
    res.status(500).json({ message: 'Failed to fetch curriculums' });
  }
});

// GET single curriculum with items
router.get('/:id', async (req, res) => {
  try {
    const curriculum = await Curriculum.findByPk(req.params.id, {
      include: [{ 
        model: CurriculumItem, 
        as: 'items',
        order: [['order', 'ASC']] 
      }]
    });
    if (!curriculum) {
      return res.status(404).json({ message: 'Curriculum not found' });
    }
    res.json(curriculum);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch curriculum' });
  }
});

// POST create curriculum
router.post('/', async (req, res) => {
  try {
    const { title, subject, educationalLevel, description } = req.body;
    const newCurriculum = await Curriculum.create({
      title, subject, educationalLevel, description
    });
    res.status(201).json(newCurriculum);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create curriculum', error: error.message });
  }
});

// POST add item to curriculum
router.post('/:id/items', async (req, res) => {
  try {
    const curriculumId = req.params.id;
    const { title, order, unitTitle, estimatedSessions, linkedTemplateId } = req.body;
    
    const newItem = await CurriculumItem.create({
      curriculumId,
      title,
      order,
      unitTitle,
      estimatedSessions,
      linkedTemplateId
    });
    
    res.status(201).json(newItem);
  } catch (error) {
    res.status(400).json({ message: 'Failed to add item', error: error.message });
  }
});

// POST bulk add items to curriculum
router.post('/:id/items/bulk', async (req, res) => {
  try {
    const curriculumId = req.params.id;
    const items = req.body.items; // Expecting an array of items

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No items provided' });
    }

    const newItems = items.map(item => ({
      ...item,
      curriculumId
    }));

    const createdItems = await CurriculumItem.bulkCreate(newItems);
    
    res.status(201).json(createdItems);
  } catch (error) {
    res.status(400).json({ message: 'Failed to add items', error: error.message });
  }
});

// PUT update item
router.put('/items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const item = await CurriculumItem.findByPk(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    
    await item.update(req.body);
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update item' });
  }
});

// DELETE item
router.delete('/items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const item = await CurriculumItem.findByPk(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    
    await item.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete item' });
  }
});

// DELETE curriculum
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const curriculum = await Curriculum.findByPk(id);
    if (!curriculum) return res.status(404).json({ message: 'Curriculum not found' });
    
    // Delete associated items first (optional if cascade delete is set up, but good practice)
    await CurriculumItem.destroy({ where: { curriculumId: id } });
    
    await curriculum.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting curriculum:', error);
    res.status(500).json({ message: 'Failed to delete curriculum' });
  }
});

module.exports = router;
