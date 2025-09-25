const express = require('express');
const router = express.Router();
const {
  getAllLessonTemplates,
  createLessonTemplate,
  updateLessonTemplate,
  deleteLessonTemplate,
  importLessonTemplates
} = require('./lessonTemplatesDB');

// GET /api/lesson-templates - جلب جميع القوالب
router.get('/', getAllLessonTemplates);

// POST /api/lesson-templates - إنشاء قالب جديد
router.post('/', createLessonTemplate);

// PUT /api/lesson-templates/:id - تحديث قالب
router.put('/:id', updateLessonTemplate);

// DELETE /api/lesson-templates/:id - حذف قالب
router.delete('/:id', deleteLessonTemplate);

// POST /api/lesson-templates/import - استيراد قوالب متعددة
router.post('/import', importLessonTemplates);

module.exports = router;