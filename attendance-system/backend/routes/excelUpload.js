const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const { Student, Section } = require('../models');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// رفع ملف اكسيل للطلاب في قسم معين
router.post('/upload-students/:sectionId', upload.single('file'), async (req, res) => {
  try {
    const { sectionId } = req.params;
    const section = await Section.findByPk(sectionId);
    if (!section) return res.status(404).json({ message: 'القسم غير موجود' });
    if (!req.file) return res.status(400).json({ message: 'لم يتم رفع أي ملف' });
    // قراءة ملف اكسيل
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet);
    // تحويل الصفوف إلى بيانات الطلاب وفلترتها
    const studentData = rows.map((row, idx) => ({
      id: `student_${Date.now()}_${idx}`,
      firstName: (row['الاسم'] || row['firstName'] || '').trim(),
      lastName: (row['النسب'] || row['lastName'] || '').trim(),
      sectionId,
      classOrder: row['ر.ت'] || row['order'] || idx + 1
    }));

    const validStudents = studentData.filter(s => s.firstName && s.lastName);

    if (validStudents.length === 0) {
      return res.status(400).json({ message: 'لم يتم العثور على طلاب صالحين في الملف. يرجى التحقق من أن الأعمدة "الاسم" و "النسب" موجودة وغير فارغة.' });
    }

    // إضافة الطلاب دفعة واحدة
    await Student.bulkCreate(validStudents);
    res.json({ message: `تمت إضافة ${validStudents.length} من الطلاب بنجاح.`, count: validStudents.length });
  } catch (err) {
    console.error('excel upload error', err);
    res.status(500).json({ message: 'فشل في رفع الملف', error: err.message });
  }
});

module.exports = router;
