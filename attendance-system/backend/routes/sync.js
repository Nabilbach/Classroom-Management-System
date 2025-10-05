const express = require('express');
const router = express.Router();
const { Attendance, Student, Section } = require('../models');
const auth = require('../middleware/auth');

// استيراد بيانات الحضور (مزامنة من نسخة الأستاذ إلى المركزي)
router.post('/import-attendance', auth, async (req, res) => {
  try {
    const { attendanceRecords, teacherId } = req.body;
    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return res.status(400).json({ message: 'بيانات الحضور غير صالحة' });
    }
    // التحقق من صلاحية المدرس للصفوف
    // ملاحظة: يجب جلب الصفوف من قاعدة البيانات
    // هنا نستخدم req.user.id كمعرف المدرس
    // جلب الصفوف المسموح بها للمدرس
    // ... يمكن تحسين المنطق لاحقاً
    // حفظ السجلات
    const created = [];
    for (const record of attendanceRecords) {
      // تحقق من sectionId للمدرس
      // ...
      const att = await Attendance.create(record);
      created.push(att);
    }
    res.json({ message: 'تم استيراد بيانات الحضور بنجاح', count: created.length });
  } catch (error) {
    console.error('خطأ في استيراد بيانات الحضور:', error);
    res.status(500).json({ message: 'فشل في استيراد بيانات الحضور', error: error.message });
  }
});

// تصدير بيانات الحضور (مزامنة من المركزي إلى نسخة الأستاذ)
router.get('/export-attendance/:teacherId', auth, async (req, res) => {
  try {
    const teacherId = req.params.teacherId;
    // تحقق من الصلاحيات
    if (req.user.role !== 'admin' && req.user.id !== teacherId) {
      return res.status(403).json({ message: 'غير مصرح بالوصول' });
    }
    // جلب الصفوف للمدرس
    // ...
    // جلب بيانات الحضور
    const attendanceRecords = await Attendance.findAll({
      include: [
        { model: Student, attributes: ['id', 'first_name', 'last_name', 'section_id'] },
        { model: Section }
      ]
    });
    res.json(attendanceRecords);
  } catch (error) {
    console.error('خطأ في تصدير بيانات الحضور:', error);
    res.status(500).json({ message: 'فشل في تصدير بيانات الحضور', error: error.message });
  }
});

module.exports = router;
