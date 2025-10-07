const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();
const auth = require('../middleware/auth');
const { User, Section, Student, sequelize } = require('../models');
const bcrypt = require('bcrypt');

// DELETE /api/admin/users/:id -> حذف أستاذ
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'الأستاذ غير موجود' });
    await user.destroy();
    res.json({ message: 'تم حذف الأستاذ بنجاح' });
  } catch (err) {
    console.error('delete teacher error', err);
    res.status(500).json({ message: 'فشل في حذف الأستاذ', error: err.message });
  }
});

// POST /api/setup/create-admin -> create initial admin if no users exist (dev helper)
router.post('/setup/create-admin', async (req, res) => {
  try {
    const count = await User.count();
    if (count > 0) return res.status(400).json({ message: 'admin already exists' });
    const { username, password, fullName } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'username and password required' });
    const hashed = await bcrypt.hash(password, 10);
    const id = 'user_' + Date.now();
    const user = await User.create({ id, username, password: hashed, fullName: fullName || username, role: 'admin' });
    res.json({ message: 'admin created', user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error('create-admin error', err);
    res.status(500).json({ message: 'failed' });
  }
});

// GET /api/users?role=teacher
router.get('/users', async (req, res) => {
  try {
    const where = {};
    if (req.query.role) where.role = req.query.role;
    const users = await User.findAll({ where, include: [Section] });
    res.json(users);
  } catch (err) {
    console.error('Failed to list users', err);
    res.status(500).json({ message: 'خطأ في جلب المستخدمين' });
  }
});

// GET /api/sections
router.get('/sections', async (req, res) => {
  try {
    const sections = await Section.findAll();
    res.json(sections);
  } catch (err) {
    console.error('Failed to list sections', err);
    res.status(500).json({ message: 'خطأ في جلب الصفوف' });
  }
});

// GET /api/students?section_id=...
router.get('/students', async (req, res) => {
  try {
    const where = {};
    if (req.query.section_id) where.sectionId = req.query.section_id;
    const students = await Student.findAll({ where });
    res.json(students);
  } catch (err) {
    console.error('Failed to list students', err);
    res.status(500).json({ message: 'خطأ في جلب التلاميذ' });
  }
});

// POST /api/admin/assign-sections { teacherId, sectionIds: [] }
// Protected: only admin or the teacher (owner) can modify assignments
router.post('/assign-sections', auth, async (req, res) => {
  try {
    const { teacherId, sectionIds } = req.body;
    if (!teacherId || !Array.isArray(sectionIds)) return res.status(400).json({ message: 'بيانات غير صحيحة' });
    // check permissions
    if (req.user.role !== 'admin' && req.user.id !== teacherId) {
      return res.status(403).json({ message: 'غير مصرح' });
    }
    const teacher = await User.findByPk(teacherId);
    if (!teacher) return res.status(404).json({ message: 'المعلم غير موجود' });
    await teacher.setSections(sectionIds);
    res.json({ message: 'تم إسناد الصفوف للمعلم' });
  } catch (err) {
    console.error('assign sections error', err);
    res.status(500).json({ message: 'فشل في إسناد الصفوف' });
  }
});

// POST /api/admin/create-instance { teacherId, outputFolder }
// Protected: only admin or owner can create an instance
router.post('/create-instance', auth, async (req, res) => {
  try {
    const { teacherId, outputFolder } = req.body;
    if (!teacherId) return res.status(400).json({ message: 'الباراميتر teacherId مطلوب' });

    // permission
    if (req.user.role !== 'admin' && req.user.id !== teacherId) return res.status(403).json({ message: 'غير مصرح' });

    const teacher = await User.findByPk(teacherId, { include: [Section] });
    if (!teacher) return res.status(404).json({ message: 'المعلم غير موجود' });

    const assignedSections = teacher.Sections || [];
    if (!assignedSections.length) return res.status(400).json({ message: 'لا توجد أقسام مسندة لهذا المعلم' });

    // ensure instances root and sanitize path
    const INSTANCES_ROOT = path.resolve(process.cwd(), 'teacher-instances');
    await fs.ensureDir(INSTANCES_ROOT);
    const safeUsername = teacher.username.replace(/[^a-zA-Z0-9-_\.]/g, '_');
    const teacherFolder = path.join(INSTANCES_ROOT, safeUsername);

    // Ensure teacherFolder is inside INSTANCES_ROOT
    const resolved = path.resolve(teacherFolder);
    if (!resolved.startsWith(INSTANCES_ROOT)) return res.status(400).json({ message: 'مسار غير صالح' });

    await fs.ensureDir(teacherFolder);

    const TEMPLATE_PATH = path.join(__dirname, '..', '..');
    await fs.copy(TEMPLATE_PATH, teacherFolder, {
      filter: src => !src.includes('teacher-instances') && !src.includes('attendance-central.db')
    });

    const teacherDbPath = path.join(teacherFolder, 'attendance-local.db');
    const db = new sqlite3.Database(teacherDbPath);

    db.serialize(async () => {
      db.run(`CREATE TABLE IF NOT EXISTS User (
        id TEXT PRIMARY KEY,
        username TEXT,
        password TEXT,
        fullName TEXT,
        centralServerUrl TEXT DEFAULT 'http://localhost:4001'
      )`);
      db.run(`INSERT OR REPLACE INTO User VALUES (?, ?, ?, ?, ?)`, [teacher.id, teacher.username, '', teacher.fullName, 'http://localhost:4001']);
      db.run(`CREATE TABLE IF NOT EXISTS Sections (
        id TEXT PRIMARY KEY,
        name TEXT,
        educationalLevel TEXT
      )`);
      db.run(`CREATE TABLE IF NOT EXISTS Students (
        id INTEGER PRIMARY KEY,
        first_name TEXT,
        last_name TEXT,
        section_id TEXT,
        class_order INTEGER
      )`);
      db.run(`CREATE TABLE IF NOT EXISTS Attendances (
        id INTEGER PRIMARY KEY,
        studentId INTEGER,
        sectionId TEXT,
        date TEXT,
        isPresent INTEGER,
        createdAt TEXT,
        updatedAt TEXT,
        syncedToServer INTEGER DEFAULT 0
      )`);
      db.run(`CREATE TABLE IF NOT EXISTS SyncLog (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT,
        timestamp TEXT,
        details TEXT
      )`);
      db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_attendance_student_date ON Attendances (studentId, date)`);

      // insert sections and their students
      const sectionIds = assignedSections.map(s => s.id);
      const sections = await Section.findAll({ where: { id: sectionIds } });
      const insertSection = db.prepare(`INSERT OR REPLACE INTO Sections VALUES (?, ?, ?)`);
      for (const s of sections) insertSection.run(s.id, s.name, s.educationalLevel);
      insertSection.finalize();

      const students = await Student.findAll({ where: { section_id: sectionIds } });
      const insertStudent = db.prepare(`INSERT OR REPLACE INTO Students VALUES (?, ?, ?, ?, ?)`);
      for (const st of students) insertStudent.run(st.id, st.first_name, st.last_name, st.section_id, st.class_order);
      insertStudent.finalize();

      db.close();
      res.json({ message: 'تم إنشاء نسخة الأستاذ بنجاح', path: teacherFolder, sections: sections.length, students: students.length });
    });
  } catch (err) {
    console.error('create-instance error', err);
    res.status(500).json({ message: 'فشل في إنشاء نسخة الأستاذ', error: err.message });
  }
});

// GET /api/sections/:id/students-count -> returns { count }
router.get('/sections/:id/students-count', async (req, res) => {
  try {
    const id = req.params.id;
    const count = await Student.count({ where: { section_id: id } });
    res.json({ id, count });
  } catch (err) {
    console.error('sections count error', err);
    res.status(500).json({ message: 'فشل في جلب عدد التلاميذ' });
  }
});

// POST /api/admin/users  -> create a user (teacher/admin)
// Accepts: { firstName, lastName, subject }
router.post('/users', async (req, res) => {
  try {
    // Temporarily removed auth for testing
    // if (req.user.role !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    
    const { firstName, lastName, subject } = req.body;
    
    if (!firstName || !lastName) {
      return res.status(400).json({ message: 'يجب توفير الاسم الشخصي والاسم العائلي' });
    }
    
    // توليد اسم مستخدم واضح دائماً
    // تنظيف المدخلات من الفراغات والرموز غير الصالحة
    const cleanFirst = (firstName || '').trim().replace(/[^a-zA-Z0-9]/g, '')
    const cleanLast = (lastName || '').trim().replace(/[^a-zA-Z0-9]/g, '')
    let username = '';
    if (cleanFirst && cleanLast) {
      username = (cleanFirst + '.' + cleanLast).toLowerCase();
    } else if (cleanFirst) {
      username = cleanFirst.toLowerCase();
    } else if (cleanLast) {
      username = cleanLast.toLowerCase();
    }
    // إذا بقي فارغاً أو نقطة فقط، استخدم "teacher" مع رقم عشوائي
    if (!username || username === '.' || username === '') {
      username = 'teacher' + Math.floor(Math.random() * 10000);
    }
    // تحقق من التكرار
    const existing = await User.findOne({ where: { username } });
    if (existing) {
      username = username + Math.floor(Math.random() * 1000);
    }
    
    // Generate a default password (first 3 chars of first name + last 4 digits of timestamp)
    const password = firstName.substring(0, 3).toLowerCase() + Date.now().toString().slice(-4);
    const hashed = await bcrypt.hash(password, 10);
    
    const fullName = `${firstName} ${lastName}`;
    const role = 'teacher';
    const id = 'user_' + Date.now();
    
    const user = await User.create({ 
      id, 
      username, 
      password: hashed, 
      fullName, 
      role, 
      subject: subject || '' 
    });
    
    res.json({ 
      message: 'تم إنشاء الأستاذ بنجاح', 
      user: { 
        id: user.id, 
        username: user.username, 
        fullName: user.fullName, 
        role: user.role, 
        subject: user.subject 
      },
      credentials: {
        username: user.username,
        password: password // Return generated password so user knows it
      }
    });
  } catch (err) {
    console.error('create user error', err);
    res.status(500).json({ message: 'فشل في إنشاء الأستاذ', error: err.message });
  }
});

// POST /api/admin/sections -> create a section
router.post('/sections', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    const { id, name, educationalLevel, specialization } = req.body;
    if (!name) return res.status(400).json({ message: 'name required' });
    const genId = id && id.toString().trim() ? id.toString().trim() : `section_${Date.now()}`;
    const existing = await Section.findByPk(genId);
    if (existing) return res.status(400).json({ message: 'الصف موجود بالفعل' });
    const section = await Section.create({ id: genId, name, educationalLevel: educationalLevel || '', specialization: specialization || '' });
    res.json({ message: 'تم إنشاء الصف', section });
  } catch (err) {
    console.error('create section error', err);
    res.status(500).json({ message: 'فشل في إنشاء الصف' });
  }
});

// POST /api/admin/sections/bulk -> create multiple sections
router.post('/sections/bulk', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    const sections = req.body.sections;
    if (!Array.isArray(sections) || !sections.length) return res.status(400).json({ message: 'sections array required' });
    const created = [];
    for (const s of sections) {
      const name = s.name || s.label || s.title;
      if (!name) continue;
      const educationalLevel = s.educationalLevel || s.level || '';
      const specialization = s.specialization || s.speciality || s.special || '';
      const id = s.id && s.id.toString().trim() ? s.id.toString().trim() : `section_${Date.now()}_${Math.floor(Math.random()*1000)}`;
      // skip if exists
      const existing = await Section.findByPk(id);
      if (existing) continue;
      const sec = await Section.create({ id, name, educationalLevel, specialization });
      created.push(sec);
    }
    res.json({ message: 'تم إنشاء الصفوف', count: created.length });
  } catch (err) {
    console.error('bulk create sections error', err);
    res.status(500).json({ message: 'فشل في إنشاء الصفوف' });
  }
});

// POST /api/admin/students/bulk -> bulk create students (array)
router.post('/students/bulk', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    const students = req.body.students;
    if (!Array.isArray(students) || !students.length) return res.status(400).json({ message: 'students array required' });
    const created = [];
    for (const s of students) {
      // expect { id, first_name, last_name, section_id, class_order }
      const st = await Student.create({ id: s.id || Date.now().toString(), first_name: s.first_name || '', last_name: s.last_name || '', section_id: s.section_id, class_order: s.class_order || 0 });
      created.push(st);
    }
    res.json({ message: 'تم إضافة الطلاب', count: created.length });
  } catch (err) {
    console.error('bulk students error', err);
    res.status(500).json({ message: 'فشل في إضافة الطلاب' });
  }
});

// DELETE /api/admin/sections/:id -> delete a section
// TODO: Re-enable auth middleware after implementing login in frontend

// حذف القسم مع حذف جميع الطلاب المرتبطين به تلقائياً
router.delete('/sections/:id', async (req, res) => {
  try {
    // Temporarily removed auth check for testing
    // if (req.user.role !== 'admin') return res.status(403).json({ message: 'غير مصرح' });
    const { id } = req.params;
    const section = await Section.findByPk(id);
    if (!section) return res.status(404).json({ message: 'القسم غير موجود' });

  // حذف جميع الطلاب المرتبطين بالقسم باستخدام استعلام خام على الجدول الصحيح
  await sequelize.getQueryInterface().bulkDelete('Students', { sectionId: id });

    await section.destroy();
    res.json({ message: 'تم حذف القسم وجميع الطلاب المرتبطين به بنجاح' });
  } catch (err) {
    console.error('delete section error', err);
    res.status(500).json({ message: 'فشل في حذف القسم', error: err.message });
  }
});

// GET /api/sections/:id -> returns section details
router.get('/sections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const section = await Section.findByPk(id);
    if (!section) return res.status(404).json({ message: 'القسم غير موجود' });
    res.json(section);
  } catch (err) {
    console.error('get section details error', err);
    res.status(500).json({ message: 'فشل في جلب بيانات القسم', error: err.message });
  }
});

// DELETE /api/admin/students?section_id=...  حذف جميع تلاميذ قسم
router.delete('/students', async (req, res) => {
  try {
    const where = {};
    if (req.query.section_id) where.sectionId = req.query.section_id;
    const deletedCount = await Student.destroy({ where });
    return res.json({ message: `تم حذف ${deletedCount} تلميذ`, count: deletedCount });
  } catch (err) {
    console.error('Failed to delete students', err);
    return res.status(500).json({ message: 'فشل في حذف التلاميذ', error: err.message });
  }
});

module.exports = router;
