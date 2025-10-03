const express = require('express');
const router = express.Router();
const { analyzeCurrentSchedule } = require('../analyze-current-schedule');

// GET current lesson information
router.get('/current-lesson', async (req, res) => {
  try {
    const analysis = await analyzeCurrentSchedule();
    
    res.json({
      success: true,
      data: analysis,
      message: analysis.isTeachingTime 
        ? 'تم العثور على حصة حالية' 
        : 'لا يوجد حصص حالياً، سيتم عرض القسم الافتراضي'
    });
    
  } catch (error) {
    console.error('Error analyzing current schedule:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في تحليل الجدول الحالي',
      error: error.message
    });
  }
});

module.exports = router;