const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const models = require('./models');

// ترقية تلقائية: حذف العمود القديم section_id من جدول الطلاب إذا كان موجوداً
sequelize.getQueryInterface().describeTable('Students').then(async (desc) => {
  if (desc.section_id) {
    await sequelize.getQueryInterface().removeColumn('Students', 'section_id');
    console.log('تم حذف العمود القديم section_id من جدول الطلاب');
  }
  if (desc.section_id && !desc.sectionId) {
    await sequelize.getQueryInterface().renameColumn('Students', 'section_id', 'sectionId');
    console.log('تم تعديل اسم العمود section_id إلى sectionId في جدول الطلاب');
  }
}).catch((err) => {
  console.error('خطأ في ترقية جدول الطلاب:', err);
});

const app = express();
const PORT = process.env.PORT || 4001;

// Allow CORS from the central frontend and other origins
app.use(cors({
  origin: function(origin, callback){
    // allow requests with no origin (like curl/postman)
    if(!origin) return callback(null, true);
    // whitelist local dev origins
    const whitelist = ['http://localhost:5173','http://localhost:5174','http://localhost:5175','http://localhost:5176','http://localhost:4001','http://localhost:3000','http://localhost:5177','http://localhost:5178'];
    if(whitelist.indexOf(origin) !== -1) return callback(null, true);
    callback(null, true); // allow all for now
  },
  credentials: true
}));
app.use(express.json());




// ترقية تلقائية: إضافة حقل subject إذا لم يكن موجوداً

sequelize.getQueryInterface().describeTable('Users').then(async (desc) => {
// Make automatic schema migrations opt-in to avoid destructive ALTER operations on startup
// Set AUTO_MIGRATE=true in env if you want sequelize.sync({ alter: true }) to run at startup
const runAutoMigrate = process.env.AUTO_MIGRATE === 'true';

const mountRoutesAndStart = () => {
  // ربط مسارات النظام
  const attendanceRoutes = require('./routes/attendance');
  const authRoutes = require('./routes/auth');
  const adminRoutes = require('./routes/admin');
  const syncRoutes = require('./routes/sync');
  const excelUploadRoutes = require('./routes/excelUpload');

  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/sync', syncRoutes);
  app.use('/api/excel', excelUploadRoutes);

  app.get('/', (req, res) => {
    res.send('Attendance System API is running.');
  });

  app.listen(PORT, () => {
    console.log(`🚀 Attendance backend running on http://localhost:${PORT}`);
  });
};

sequelize.getQueryInterface().describeTable('Users').then(async (desc) => {
  if (!desc.subject && runAutoMigrate) {
    try {
      await sequelize.getQueryInterface().addColumn('Users', 'subject', {
        type: require('sequelize').STRING,
        allowNull: true
      });
      console.log('تمت إضافة حقل subject لجدول Users');
    } catch (e) {
      console.warn('فشل في إضافة حقل subject:', e.message || e);
    }
  }

  if (runAutoMigrate) {
    try {
      await sequelize.query('PRAGMA foreign_keys = OFF;');
      // Attempt to clean old backup tables that historically caused UNIQUE constraint failures
      try { await sequelize.query('DROP TABLE IF EXISTS Sections_backup;'); } catch (e) { /* ignore */ }
      try { await sequelize.query('DROP TABLE IF EXISTS `Sections_backup`;'); } catch (e) { /* ignore */ }
      try { await sequelize.query('DROP TABLE IF EXISTS "Sections_backup";'); } catch (e) { /* ignore */ }
      await sequelize.sync({ alter: true });
      await sequelize.query('PRAGMA foreign_keys = ON;');
      console.log('✅ Automatic migration completed');
    } catch (err) {
      console.warn('تحذير: فشل التزامن التلقائي للسكيمة (الأخطاء لم تمنع بدء الخادم):', err.message || err);
    }
  } else {
    console.log('ملاحظة: تم تخطي التزامن الآلي للسكيمة (AUTO_MIGRATE not set).');
  }

  // Mount routes and start server regardless of migration outcome
  mountRoutesAndStart();

}).catch((err) => {
  console.error('خطأ في فحص جدول Users قبل التهيئة:', err);
  // Even if describeTable fails, still mount routes so API can respond (degraded mode)
  mountRoutesAndStart();
});

  // ربط مسارات النظام
  const attendanceRoutes = require('./routes/attendance');
  const authRoutes = require('./routes/auth');
  const adminRoutes = require('./routes/admin');
  const syncRoutes = require('./routes/sync');
  const excelUploadRoutes = require('./routes/excelUpload');

  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/sync', syncRoutes);
  app.use('/api/excel', excelUploadRoutes);

  app.get('/', (req, res) => {
    res.send('Attendance System API is running.');
  });

  app.listen(PORT, () => {
    console.log(`🚀 Attendance backend running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('❌ خطأ في تهيئة قاعدة البيانات:', err);
});
