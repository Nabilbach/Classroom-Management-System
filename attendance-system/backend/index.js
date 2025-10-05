const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const models = require('./models');

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



// مزامنة قاعدة البيانات
sequelize.sync({ alter: true }).then(() => {
  console.log('✅ قاعدة البيانات جاهزة');

  // ربط مسارات النظام
  const attendanceRoutes = require('./routes/attendance');
  const authRoutes = require('./routes/auth');
  const adminRoutes = require('./routes/admin');
  const syncRoutes = require('./routes/sync');

  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/sync', syncRoutes);

  app.get('/', (req, res) => {
    res.send('Attendance System API is running.');
  });

  app.listen(PORT, () => {
    console.log(`🚀 Attendance backend running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('❌ خطأ في تهيئة قاعدة البيانات:', err);
});
