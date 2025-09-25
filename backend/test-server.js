const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// إضافة middleware للتسجيل
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// تحميل مسارات القوالب
console.log('🔄 تحميل مسارات القوالب...');
try {
  const lessonTemplatesRoutes = require('./routes/lessonTemplatesRoutes');
  app.use('/api/lesson-templates', lessonTemplatesRoutes);
  console.log('✅ تم تحميل مسارات القوالب بنجاح');
} catch (error) {
  console.error('❌ خطأ في تحميل مسارات القوالب:', error.message);
  process.exit(1);
}

// نقطة اختبار بسيطة
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// بدء الخادم
const PORT = 3001; // منفذ مختلف لتجنب التضارب
app.listen(PORT, () => {
  console.log(`✅ خادم الاختبار يعمل على http://localhost:${PORT}`);
});