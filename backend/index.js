// ⚠️ PRODUCTION SERVER - Uses classroom.db (REAL DATA)
// Load production environment FIRST before anything else
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.production') });

const express = require('express');
const cors = require('cors');
const db = require('./models');
const SequelizeLib = require('sequelize');
const { Op } = require('sequelize');

const app = express();
const PORT = process.env.PORT || 4200; // Production port

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for Electron/Localhost
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true, charset: 'utf-8' }));

// Set default charset for responses
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Routes
const attendanceRoutes = require('./routes/attendance');
app.use('/api/attendance', attendanceRoutes);
// Scheduled lessons API
const scheduledLessonsRoutes = require('./routes/scheduledLessons');
app.use('/api/scheduled-lessons', scheduledLessonsRoutes);
// Section statistics API
const sectionStatsRoutes = require('./routes/sectionStats');
app.use('/api/sections/stats', sectionStatsRoutes);
// Lesson templates API
const lessonTemplatesRoutes = require('./routes/lessonTemplatesRoutes');
app.use('/api/lesson-templates', lessonTemplatesRoutes);

// Backup status API
const fs = require('fs');
const path = require('path');

app.get('/api/backup-status', async (req, res) => {
  try {
    const backupDir = path.join(__dirname, '..', 'automated_backups');
    let lastBackup = null;
    let isRunning = false;
    
    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir)
        .filter(file => file.startsWith('auto_backup_'))
        .map(file => ({
          name: file,
          path: path.join(backupDir, file),
          stat: fs.statSync(path.join(backupDir, file))
        }))
        .sort((a, b) => b.stat.mtime - a.stat.mtime);

      if (files.length > 0) {
        lastBackup = files[0].stat.mtime.toISOString();
        // إذا كانت آخر نسخة احتياطية خلال آخر 8 ساعات، فالخدمة نشطة
        const timeDiff = Date.now() - files[0].stat.mtime.getTime();
        isRunning = timeDiff < (8 * 60 * 60 * 1000);
      }
    }

    res.json({
      isRunning,
      lastBackup,
      nextBackup: null, // يمكن حسابها لاحقاً
      backupCount: fs.existsSync(backupDir) ? fs.readdirSync(backupDir).filter(f => f.startsWith('auto_backup_')).length : 0
    });
  } catch (error) {
    console.error('Error checking backup status:', error);
    res.status(500).json({
      isRunning: false,
      lastBackup: null,
      nextBackup: null,
      backupCount: 0
    });
  }
});

// Health check endpoints used by frontend to perform soft reconnects
app.head('/api/health', (req, res) => {
  // respond quickly with 200 and no body
  res.status(200).end();
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

// ✅ اختبار الإصلاح - endpoint للتحقق من أن جميع التقييمات تظهر بشكل صحيح
app.get('/api/test-assessment-fix', async (req, res) => {
  try {
    const count = await db.StudentAssessment.count();
    const sample = await db.StudentAssessment.findOne({
      include: [{ model: db.Student, as: 'student' }]
    });
    
    res.json({
      success: true,
      total_assessments: count,
      sample_with_student: sample,
      status: count > 0 ? '✅ الإصلاح نجح!' : '❌ المشكلة لا تزال موجودة'
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message,
      stack: err.stack 
    });
  }
});

// Helper function to get the current score for a student
const getCurrentScore = async (studentId) => {
  try {
    const lastAssessment = await db.StudentAssessment.findOne({
      where: { studentId },
      order: [[ 'date', 'DESC' ]],
    });
    console.log(`Score for student ${studentId}:`, lastAssessment ? lastAssessment.new_score : 0);
    return lastAssessment ? lastAssessment.new_score : 0;
  } catch (error) {
    console.error(`Error getting score for student ${studentId}:`, error);
    return 0;
  }
};

// Routes for Lessons
app.get('/api/lessons', async (req, res) => {
  try {
    const lessons = await db.Lesson.findAll({
      attributes: [
        'id', 
        'templateId', 
        'sectionId', 
        'date', 
        'startTime', 
        'endTime', 
        'status', 
        'actualContent', 
        'homework', 
        'notes',
        'createdAt',
        'updatedAt'
      ]
    });
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving lessons', error: error.message, stack: error.stack });
  }
});

app.post('/api/lessons', async (req, res) => {
  try {
    const newLesson = await db.Lesson.create({ id: Date.now().toString(), ...req.body });
    res.status(201).json(newLesson);
  } catch (error) {
    res.status(500).json({ message: 'Error creating lesson', error: error.message, stack: error.stack });
  }
});

app.put('/api/lessons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await db.Lesson.update(req.body, { where: { id } });
    if (updated) {
      const updatedLesson = await db.Lesson.findByPk(id);
      res.json(updatedLesson);
    } else {
      res.status(404).json({ message: 'Lesson not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating lesson', error: error.message, stack: error.stack });
  }
});

app.delete('/api/lessons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.Lesson.destroy({ where: { id } });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Lesson not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting lesson', error: error.message, stack: error.stack });
  }
});

// Routes for Lesson Logs
app.get('/api/lesson-logs', async (req, res) => {
  try {
    const lessonLogs = await db.LessonLog.findAll();
    res.json(lessonLogs);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving lesson logs', error: error.message, stack: error.stack });
  }
});

app.post('/api/lesson-logs', async (req, res) => {
  try {
    const newLog = await db.LessonLog.create({ id: Date.now().toString(), ...req.body });
    res.status(201).json(newLog);
  } catch (error) {
    res.status(500).json({ message: 'Error creating lesson log', error: error.message, stack: error.stack });
  }
});

app.put('/api/lesson-logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await db.LessonLog.update(req.body, { where: { id } });
    if (updated) {
      const updatedLog = await db.LessonLog.findByPk(id);
      res.json(updatedLog);
    } else {
      res.status(404).json({ message: 'Lesson log not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating lesson log', error: error.message, stack: error.stack });
  }
});

app.delete('/api/lesson-logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.LessonLog.destroy({ where: { id } });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Lesson log not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting lesson log', error: error.message, stack: error.stack });
  }
});

// Routes for Sections
app.get('/api/sections', async (req, res) => {
  try {
    const sections = await db.Section.findAll();
    res.json(sections);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving sections', error: error.message, stack: error.stack });
  }
});

app.post('/api/sections', async (req, res) => {
  try {
    const newSection = await db.Section.create({ id: Date.now().toString(), ...req.body });
    res.status(201).json(newSection);
  } catch (error) {
    res.status(500).json({ message: 'Error creating section', error: error.message, stack: error.stack });
  }
});

app.put('/api/sections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await db.Section.update(req.body, { where: { id } });
    if (updated) {
      const updatedSection = await db.Section.findByPk(id);
      res.json(updatedSection);
    } else {
      res.status(404).json({ message: 'Section not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating section', error: error.message, stack: error.stack });
  }
});

app.delete('/api/sections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.Section.destroy({ where: { id } });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Section not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating section', error: error.message, stack: error.stack });
  }
});

// Route to delete all sections
app.delete('/api/sections/all', async (req, res) => {
  try {
    await db.Section.destroy({ truncate: true });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting all sections:', error);
    res.status(500).json({ message: 'Error deleting all sections', error: error.message, stack: error.stack });
  }
});

// Delete all students in a specific section
app.delete('/api/sections/:id/students', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.Student.destroy({ where: { sectionId: id } });
    res.json({ message: `Deleted ${deleted} students from section ${id}`, deletedCount: deleted });
  } catch (error) {
    console.error('Error deleting students by section:', error);
    res.status(500).json({ message: 'Error deleting students by section', error: error.message, stack: error.stack });
  }
});

// Routes for Students
app.get('/api/students', async (req, res) => {
  try {
    const { section_id } = req.query;
    const where = section_id ? { sectionId: section_id } : {};
    const students = await db.Student.findAll({ where });

    // Get latest assessments for the returned students and compute helpful fields
    const studentIds = students.map(student => student.id);
    const assessments = await db.StudentAssessment.findAll({
      where: { studentId: studentIds },
      order: [['date', 'DESC']]
    });

    const scoreMap = {};
    const lastAssessmentDateMap = {};
    const totalXpMap = {};

    assessments.forEach(assessment => {
      const sid = assessment.studentId;
      // only set if not set yet (because assessments are ordered by date desc)
      if (!scoreMap[sid]) {
        const ns = Number(assessment.new_score);
        scoreMap[sid] = Number.isNaN(ns) ? 0 : ns;
        lastAssessmentDateMap[sid] = assessment.date;
        // Prefer snapshot total_xp if assessment stored it (frontend can send it), otherwise map new_score (0..20) to XP.
        if (assessment.total_xp != null) {
          totalXpMap[sid] = Number.isFinite(Number(assessment.total_xp)) ? Math.round(Number(assessment.total_xp)) : 0;
        } else {
          totalXpMap[sid] = Number.isNaN(ns) ? 0 : Math.round(ns * 25);
        }
      }
    });

    const studentsWithScores = students.map(student => ({
      ...student.toJSON(),
      score: scoreMap[student.id] || 0,
      lastAssessmentDate: lastAssessmentDateMap[student.id] || null,
      total_xp: totalXpMap[student.id] || 0,
      // Ensure frontend receives featured works count even if DB column missing (fallback to 0)
      featuredWorks: typeof student.featuredWorks !== 'undefined' ? student.featuredWorks : (student.featured_works || 0),
    }));

    res.json(studentsWithScores);
  } catch (error) {
    console.error('Error retrieving students:', error);
    res.status(500).json({ 
      success: false,
      message: 'خطأ في جلب بيانات الطلاب',
      error: error.message, 
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
});

app.get('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        message: 'رقم الطالب غير صحيح',
        error: 'Valid student ID is required' 
      });
    }

    const student = await db.Student.findByPk(id);
    if (student) {
      const score = await getCurrentScore(student.id);
      const s = student.toJSON();
      s.featuredWorks = typeof s.featuredWorks !== 'undefined' ? s.featuredWorks : (s.featured_works || 0);
      res.json({ ...s, score });
    } else {
      res.status(404).json({ 
        success: false,
        message: 'الطالب غير موجود',
        error: 'Student not found' 
      });
    }
  } catch (error) {
    console.error('Error retrieving student:', error);
    res.status(500).json({ 
      success: false,
      message: 'خطأ في جلب بيانات الطالب',
      error: error.message, 
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const s = req.body || {};
    // Normalize payload keys to match model attributes (camelCase)
    const firstNameRaw = s.firstName ?? s.first_name ?? s.first ?? '';
    const lastNameRaw = s.lastName ?? s.last_name ?? s.last ?? '';
    const pnRaw = s.pathwayNumber ?? s.pathway_number ?? s.trackNumber ?? '';
    const bdRaw = s.birthDate ?? s.birth_date ?? s.dateOfBirth ?? null;
    const coRaw = s.classOrder ?? s.class_order ?? null;
    const genderRaw = s.gender ?? null;
    const sectionIdRaw = s.sectionId ?? s.section_id ?? null;

    const firstName = typeof firstNameRaw === 'string' ? firstNameRaw.trim() : firstNameRaw;
    const lastName = typeof lastNameRaw === 'string' ? lastNameRaw.trim() : lastNameRaw;
    const pathwayNumber = typeof pnRaw === 'string' ? pnRaw.trim() : pnRaw;
    const birthDate = typeof bdRaw === 'string' ? bdRaw.trim() : bdRaw;
    const classOrder = typeof coRaw === 'string' && /^\d+$/.test(coRaw) ? Number(coRaw) : coRaw;
    const gender = typeof genderRaw === 'string' ? genderRaw.trim() : genderRaw;
    const sectionId = sectionIdRaw != null ? String(sectionIdRaw) : null;

    if (!firstName || !lastName) {
      return res.status(400).json({ 
        success: false,
        message: 'الاسم الأول والأخير مطلوبان',
        error: 'firstName and lastName are required' 
      });
    }
    const payload = { firstName, lastName, pathwayNumber, birthDate, classOrder, gender, sectionId };
    const newStudent = await db.Student.create(payload);
    res.status(201).json(newStudent);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false,
        message: 'رقم المسار مكرر. يجب أن يكون رقم المسار فريداً',
        error: 'Duplicate pathway number detected',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
      });
    }
    const errMsg = `${error?.message || ''} ${error?.original?.message || ''}`;
    if (error instanceof SequelizeLib.ForeignKeyConstraintError || error.name === 'SequelizeForeignKeyConstraintError' || /FOREIGN KEY constraint failed/i.test(errMsg)) {
      return res.status(400).json({ 
        success: false,
        message: 'القسم المحدد غير موجود. اختر قسماً صحيحاً',
        error: 'Invalid sectionId',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
      });
    }
    res.status(500).json({ 
      success: false,
      message: 'خطأ في إنشاء الطالب',
      error: error.message, 
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
});

// FollowUps: create and list
app.post('/api/students/:studentId/followups', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { type, notes } = req.body;
    if (!type) return res.status(400).json({ message: 'type is required' });

    const f = await db.FollowUp.create({ studentId, type, notes: notes || null, is_open: true });
    res.status(201).json(f);
  } catch (error) {
    console.error('Error creating followup:', error);
    res.status(500).json({ message: 'Error creating followup', error: error.message, stack: error.stack });
  }
});

app.get('/api/students/:studentId/followups', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { status } = req.query;
    const where = { studentId };
    // Map legacy/clients 'status' query to the model's is_open boolean column.
    // Accepts: status=open|closed or status=true|false or status=1|0
    if (typeof status !== 'undefined') {
      const s = String(status).toLowerCase();
      if (s === 'open') {
        where.is_open = true;
      } else if (s === 'closed') {
        where.is_open = false;
      } else if (s === 'true' || s === '1') {
        where.is_open = true;
      } else if (s === 'false' || s === '0') {
        where.is_open = false;
      }
      // any other value will be ignored and no extra filter applied
    }

    const items = await db.FollowUp.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json(items);
  } catch (error) {
    console.error('Error fetching followups:', error);
    res.status(500).json({ message: 'Error fetching followups', error: error.message, stack: error.stack });
  }
});

// Endpoint: return count of open followups for a section
app.get('/api/sections/:sectionId/followups-count', async (req, res) => {
  try {
    const { sectionId } = req.params;
    // find students in section
  const students = await db.Student.findAll({ where: { sectionId }, attributes: ['id','firstName','lastName','pathwayNumber','sectionId'] });
    const studentIds = students.map(s => s.id);
    if (studentIds.length === 0) return res.json({ count: 0 });
    const count = await db.FollowUp.count({ where: { studentId: studentIds, is_open: true } });
    res.json({ count });
  } catch (error) {
    console.error('Error fetching section followup counts:', error);
    res.status(500).json({ message: 'Error fetching followup counts', error: error.message, stack: error.stack });
  }
});

// Return students in a section who have open followups, with counts
app.get('/api/sections/:sectionId/followups-students', async (req, res) => {
  try {
    const { sectionId } = req.params;
    // find students in section
  const students = await db.Student.findAll({ where: { sectionId }, attributes: ['id','firstName','lastName','pathwayNumber','classOrder','sectionId'] });
    const studentIds = students.map(s => s.id);
    if (studentIds.length === 0) return res.json([]);

    // Count open followups grouped by studentId
    const counts = await db.FollowUp.findAll({
      attributes: ['studentId', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
      where: { studentId: studentIds, is_open: true },
      group: ['studentId']
    });

    const countMap = {};
    counts.forEach(r => {
      const obj = r.toJSON();
      countMap[obj.studentId] = Number(obj.count || 0);
    });

    const result = students
      .map(s => ({ id: s.id, firstName: s.firstName, lastName: s.lastName, followupCount: countMap[s.id] || 0 }))
      .filter(s => s.followupCount > 0)
      .sort((a, b) => b.followupCount - a.followupCount);

    res.json(result);
  } catch (error) {
    console.error('Error fetching followup students for section:', error);
    res.status(500).json({ message: 'Error fetching followup students', error: error.message, stack: error.stack });
  }
});

// Update a followup (e.g., close it)
app.patch('/api/followups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    const [updated] = await db.FollowUp.update(updates, { where: { id } });
    if (updated) {
      const fu = await db.FollowUp.findByPk(id);
      res.json(fu);
    } else {
      res.status(404).json({ message: 'FollowUp not found' });
    }
  } catch (error) {
    console.error('Error updating followup:', error);
    res.status(500).json({ message: 'Error updating followup', error: error.message, stack: error.stack });
  }
});

app.post('/api/students/bulk', async (req, res) => {
  const rawStudents = req.body;
  if (!rawStudents || !Array.isArray(rawStudents)) {
    return res.status(400).json({ message: 'Invalid request body. Expected an array of students.' });
  }

  const transaction = await db.sequelize.transaction();

  try {
    // Normalize incoming records to model attribute names (camelCase)
    const students = rawStudents.map((s) => {
      const sectionIdRaw = s.sectionId ?? s.section_id ?? null;
      const sectionId = sectionIdRaw != null ? String(sectionIdRaw).trim() : null;

      const firstNameRaw = s.firstName ?? s.first_name ?? s.first ?? '';
      const lastNameRaw = s.lastName ?? s.last_name ?? s.last ?? '';
      const pnRaw = s.pathwayNumber ?? s.pathway_number ?? s.trackNumber ?? '';
      const bdRaw = s.birthDate ?? s.birth_date ?? s.dateOfBirth ?? '';

      const firstName = typeof firstNameRaw === 'string' ? firstNameRaw.trim() : firstNameRaw;
      const lastName = typeof lastNameRaw === 'string' ? lastNameRaw.trim() : lastNameRaw;
      const pathwayNumber = typeof pnRaw === 'string' && pnRaw.trim().length > 0 ? pnRaw.trim() : null;
      const birthDate = typeof bdRaw === 'string' && bdRaw.trim().length > 0 ? bdRaw.trim() : null;

      const classOrderRaw = s.classOrder ?? s.class_order ?? null;
      const classOrder = typeof classOrderRaw === 'string' && /^\d+$/.test(classOrderRaw) ? Number(classOrderRaw) : classOrderRaw;

      const genderRaw = s.gender ?? null;
      const gender = typeof genderRaw === 'string' ? genderRaw.trim() : genderRaw;

      return { firstName, lastName, pathwayNumber, birthDate, gender, classOrder, sectionId };
    });

    // Validate required fields
    const invalid = students.filter((s) => !s.firstName || !s.lastName);
    if (invalid.length > 0) {
      return res.status(400).json({ message: 'Missing required student fields (firstName, lastName) in one or more records.' });
    }

    // Check for duplicate pathway numbers within the payload (after normalization)
  const pathwayNumbers = students.map((s) => s.pathwayNumber).filter(Boolean);
    const duplicatePathwayNumbers = pathwayNumbers.filter((item, index) => pathwayNumbers.indexOf(item) !== index);
    if (duplicatePathwayNumbers.length > 0) {
      return res.status(400).json({ message: `Duplicate pathway numbers found in the request: ${duplicatePathwayNumbers.join(', ')}` });
    }

    // Check for existing pathway numbers in the database
    if (pathwayNumbers.length > 0) {
      const existingStudents = await db.Student.findAll({ where: { pathwayNumber: { [Op.in]: pathwayNumbers } } });
      if (existingStudents.length > 0) {
        const existingPathwayNumbers = existingStudents.map((s) => s.pathwayNumber);
        return res.status(400).json({ message: `The following pathway numbers already exist in the database: ${existingPathwayNumbers.join(', ')}` });
      }
    }

    const newStudents = await db.Student.bulkCreate(students, { transaction });
    await transaction.commit();
    res.status(201).json(newStudents);
  } catch (error) {
    await transaction.rollback();
    console.error('Error during bulk student creation:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Duplicate pathway number detected. Ensure all pathway numbers are unique or blank.', error: error.message, stack: error.stack });
    }
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ message: 'One or more students refer to a non-existent section. Please ensure all section IDs are valid.', error: error.message, stack: error.stack });
    }
    res.status(500).json({ message: 'Error creating students', error: error.message, stack: error.stack });
  }
});

app.put('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        message: 'رقم الطالب غير صحيح',
        error: 'Valid student ID is required' 
      });
    }

    const [updated] = await db.Student.update(req.body, { where: { id } });
    if (updated) {
      const updatedStudent = await db.Student.findByPk(id);
      res.json(updatedStudent);
    } else {
      res.status(404).json({ 
        success: false,
        message: 'الطالب غير موجود',
        error: 'Student not found' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'خطأ في تحديث بيانات الطالب',
      error: error.message, 
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
});

// Support PATCH for partial updates (same as PUT for this implementation)
app.patch('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await db.Student.update(req.body, { where: { id } });
    if (updated) {
      const updatedStudent = await db.Student.findByPk(id);
      res.json(updatedStudent);
    } else {
      res.status(404).json({ message: 'Student not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating student', error: error.message, stack: error.stack });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        message: 'رقم الطالب غير صحيح',
        error: 'Valid student ID is required' 
      });
    }

    const deleted = await db.Student.destroy({ where: { id } });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ 
        success: false,
        message: 'الطالب غير موجود',
        error: 'Student not found' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'خطأ في حذف الطالب',
      error: error.message, 
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
});

// Route to delete all students
app.delete('/api/students/all', async (req, res) => {
  try {
    await db.Student.destroy({ truncate: true });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting all students:', error);
    res.status(500).json({ message: 'Error deleting all students', error: error.message, stack: error.stack });
  }
});

// Route to reorder students
app.patch('/api/students/reorder', async (req, res) => {
  try {
    const { orderedIds } = req.body;
    
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ message: 'orderedIds must be an array' });
    }

    // Update class order for each student
    for (let i = 0; i < orderedIds.length; i++) {
      await db.Student.update(
        { classOrder: i + 1 },
        { where: { id: orderedIds[i] } }
      );
    }

    res.json({ message: 'Students reordered successfully' });
  } catch (error) {
    console.error('Error reordering students:', error);
    res.status(500).json({ message: 'Error reordering students', error: error.message, stack: error.stack });
  }
});

// Routes for Administrative Timetable Entries (Admin Schedule)
const adminScheduleRoutes = require('./routes/adminSchedule');
app.use('/api/admin-schedule', adminScheduleRoutes);

// Routes for Current Lesson Detection
const currentLessonRoutes = require('./routes/currentLesson');
app.use('/api/schedule', currentLessonRoutes);

// Routes for Textbook Entries
const textbookRoutes = require('./routes/textbook');
app.use('/api/textbook', textbookRoutes);

// Routes for Student Transfer (نقل التلاميذ)
const studentTransferRoutes = require('./routes/studentTransfer');
app.use('/api/student-transfer', studentTransferRoutes);

// Routes for Student Assessments
app.post('/api/students/:studentId/assessment', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { new_score, notes, scores, total_xp, student_level, featured } = req.body;

    console.log('[Assessment] Creating for student:', studentId);
    console.log('[Assessment] Payload:', { new_score, notes, scores, total_xp, student_level });
    // Basic validation: studentId must be present and numeric
    if (!studentId || isNaN(Number(studentId))) {
      return res.status(400).json({ message: 'Invalid studentId parameter' });
    }

    // Ensure student exists before creating assessment
    const studentRecord = await db.Student.findByPk(studentId);
    if (!studentRecord) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Use a transaction to avoid race conditions between reading last score, creating the assessment and incrementing counters
    const t = await db.sequelize.transaction();
    try {
      // Read last assessment inside the transaction
      const lastAssessmentRecord = await db.StudentAssessment.findOne({ where: { studentId }, order: [['date', 'DESC']], transaction: t });
      const old_score = lastAssessmentRecord ? Number(lastAssessmentRecord.new_score) : 0;
      const newScoreNum = typeof new_score === 'number' ? new_score : Number(new_score);
      const score_change = Number.isFinite(newScoreNum) ? (newScoreNum - old_score) : null;

      console.log('[Assessment] Scores:', { old_score, new_score: newScoreNum, score_change });

      // If this assessment is marked as a featured work, award 60 XP and increment student's featuredWorks counter
      const FEATURED_XP = 60;

      // Compute base total XP: prefer provided total_xp, otherwise prefer lastAssessment.total_xp, otherwise map new_score to XP
      let baseTotalXp = null;
      if (typeof total_xp === 'number' && Number.isFinite(total_xp)) {
        baseTotalXp = Math.round(total_xp);
      } else if (lastAssessmentRecord && lastAssessmentRecord.total_xp != null) {
        baseTotalXp = Math.round(Number(lastAssessmentRecord.total_xp));
      } else if (Number.isFinite(newScoreNum)) {
        baseTotalXp = Math.round(newScoreNum * 25);
      }

      const assessmentPayload = {
        studentId: Number(studentId),
        date: new Date().toISOString(),
        old_score: old_score,
        new_score: Number.isFinite(newScoreNum) ? newScoreNum : null,
        score_change: Number.isFinite(score_change) ? score_change : null,
        notes,
        scores: scores || null,
        // snapshot total_xp: if we can compute baseTotalXp, add FEATURED_XP when featured
        total_xp: baseTotalXp != null ? (baseTotalXp + (featured ? FEATURED_XP : 0)) : (typeof total_xp === 'number' ? Math.round(total_xp) : null),
        student_level: typeof student_level === 'number' ? student_level : null,
      };

      const newAssessment = await db.StudentAssessment.create(assessmentPayload, { transaction: t });

      // If featured flag set, increment student.featuredWorks (safe ALTER handled at startup)
      if (featured) {
        try {
          await db.Student.increment({ featuredWorks: 1 }, { where: { id: studentId }, transaction: t });
        } catch (incErr) {
          try {
            await db.sequelize.query("UPDATE Students SET featured_works = COALESCE(featured_works, 0) + 1 WHERE id = ?;", { replacements: [studentId], transaction: t });
          } catch (rawErr) {
            console.warn('Failed to increment featuredWorks for student', studentId, incErr?.message || incErr, rawErr?.message || rawErr);
          }
        }
      }

      // Insert an audit row (non-destructive)
      try {
        const payloadSnapshot = JSON.stringify({ assessmentPayload });
        await db.sequelize.query(
          'INSERT INTO AssessmentAudits (assessmentId, action, actor, payload) VALUES (?, ?, ?, ?);',
          { replacements: [newAssessment.id, 'create', (req.user && req.user.id) ? String(req.user.id) : 'system', payloadSnapshot], transaction: t }
        );
      } catch (auditErr) {
        console.warn('Failed to insert assessment audit:', auditErr?.message || auditErr);
        // don't fail the whole operation for audit errors
      }

      await t.commit();
      console.log('[Assessment] Created successfully:', newAssessment.id);
      res.status(201).json(newAssessment);
    } catch (innerErr) {
      await t.rollback();
      throw innerErr;
    }
  } catch (error) {
    console.error('[Assessment] Error:', error);
    res.status(500).json({ message: 'Error creating assessment', error: error.message, stack: error.stack });
  }
});

// Ensure Students table has featured_works column (SQLite ALTER TABLE ADD COLUMN is safe)
const ensureStudentFeaturedWorksColumn = async () => {
  try {
    const [cols] = await db.sequelize.query("PRAGMA table_info('Students');");
    const existing = Array.isArray(cols) ? cols.map(c => c.name) : [];
    if (!existing.includes('featured_works')) {
      try {
        await db.sequelize.query('ALTER TABLE Students ADD COLUMN featured_works INTEGER DEFAULT 0;');
        console.log('Applied migration: added featured_works to Students');
      } catch (e) {
        console.warn('Failed to add featured_works column:', e?.message || e);
      }
    }
  } catch (e) {
    console.warn('ensureStudentFeaturedWorksColumn warning:', e?.message || e);
  }
};

// Ensure AssessmentAudits table exists (append-only audit log)
const ensureAssessmentAuditsTable = async () => {
  try {
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS AssessmentAudits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        assessmentId INTEGER,
        action TEXT NOT NULL,
        actor TEXT,
        payload TEXT,
        createdAt DATETIME DEFAULT (datetime('now'))
      );
    `);
    console.log('Ensured AssessmentAudits table exists');
  } catch (e) {
    console.warn('Failed to ensure AssessmentAudits table:', e?.message || e);
  }
};

// Delete all assessments for a student (used to clear XP/history)
app.delete('/api/students/:studentId/assessments', async (req, res) => {
  try {
    const { studentId } = req.params;
    const deleted = await db.StudentAssessment.destroy({ where: { studentId } });
    res.json({ deletedCount: deleted });
  } catch (error) {
    console.error('Error deleting assessments for student:', error);
    res.status(500).json({ message: 'Error deleting assessments', error: error.message, stack: error.stack });
  }
});

// POST-based reset endpoint (some clients / proxies block DELETE). Same behavior as DELETE above.
app.post('/api/students/:studentId/assessments/reset', async (req, res) => {
  try {
    const { studentId } = req.params;
    const deleted = await db.StudentAssessment.destroy({ where: { studentId } });
    res.json({ deletedCount: deleted });
  } catch (error) {
    console.error('Error resetting assessments for student:', error);
    res.status(500).json({ message: 'Error resetting assessments', error: error.message, stack: error.stack });
  }
});

app.get('/api/students/:studentId/assessments', async (req, res) => {
  try {
    const { studentId } = req.params;
    const assessments = await db.StudentAssessment.findAll({ 
      where: { studentId },
      order: [[ 'date', 'DESC' ]],
    });
    res.json(assessments);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving assessments', error: error.message, stack: error.stack });
  }
});

// GET /api/sections/:sectionId/assessment-grid
// Returns for a section the latest per-student per-element scores and final score normalized to 0..10
app.get('/api/sections/:sectionId/assessment-grid', async (req, res) => {
  try {
    const { sectionId } = req.params;
    if (!sectionId) return res.status(400).json({ message: 'sectionId is required' });

    // Find students in this section
    const students = await db.Student.findAll({ where: { sectionId } });
    const studentIds = students.map(s => s.id);

    if (studentIds.length === 0) return res.json({ students: [] });

    // Fetch latest assessment for each student (take the most recent by date)
    const assessments = await db.StudentAssessment.findAll({
      where: { studentId: studentIds },
      order: [['date', 'DESC']]
    });

    // Map latest per student
    const latestByStudent = {};
    assessments.forEach(a => {
      if (!latestByStudent[a.studentId]) latestByStudent[a.studentId] = a;
    });

    // Helper: normalize element value to 0..10
    const normalizeTo10 = (v) => {
      if (v == null) return null;
      const n = Number(v);
      if (!Number.isFinite(n)) return null;
      if (n <= 1) return Math.round(n * 10 * 100) / 100;
      if (n <= 10) return Math.round(n * 100) / 100;
      if (n <= 100) return Math.round((n / 100) * 10 * 100) / 100;
      return Math.round(Math.max(0, Math.min(10, n)) * 100) / 100;
    };

    // Collect all keys and compute per-key maxima (based on latest assessments)
    const allKeys = new Set();
    students.forEach(s => {
      const a = latestByStudent[s.id];
      if (a && a.scores) {
        try {
          const obj = typeof a.scores === 'string' ? JSON.parse(a.scores) : a.scores;
          Object.keys(obj || {}).forEach(k => allKeys.add(k));
        } catch (e) {}
      }
    });
    const keys = Array.from(allKeys);

    const maxPerKey = {};
    keys.forEach(k => { maxPerKey[k] = 0; });
    students.forEach(s => {
      const a = latestByStudent[s.id];
      if (!a || !a.scores) return;
      let obj = {};
      try { obj = typeof a.scores === 'string' ? JSON.parse(a.scores) : a.scores; } catch (e) { obj = a.scores || {}; }
      keys.forEach(k => {
        const v = normalizeTo10(obj[k]);
        if (v != null && v > (maxPerKey[k] || 0)) maxPerKey[k] = v;
      });
    });

    const sumMax = keys.reduce((acc, k) => acc + (maxPerKey[k] || 0), 0);
    const scaleFactor = sumMax > 0 ? (10 / sumMax) : 1;

    const grid = students.map(s => {
      const latest = latestByStudent[s.id];
      let elementScores = {};
      let finalScore = null;
      if (latest && latest.scores) {
        let scoresObj = {};
        try {
          scoresObj = typeof latest.scores === 'string' ? JSON.parse(latest.scores) : latest.scores;
        } catch (e) {
          scoresObj = latest.scores || {};
        }

        const scaledVals = [];
        keys.forEach(k => {
          const raw = normalizeTo10(scoresObj[k]);
          if (raw == null) {
            elementScores[k] = null;
          } else {
            const scaled = Math.round(raw * scaleFactor * 100) / 100;
            elementScores[k] = scaled;
            scaledVals.push(scaled);
          }
        });

        if (scaledVals.length > 0) {
          finalScore = Math.round(Math.min(10, scaledVals.reduce((a, b) => a + b, 0)) * 100) / 100;
        }
      }

      return {
        studentId: s.id,
        familyName: s.lastName || '',
        fullName: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
        pathwayNumber: s.pathwayNumber || s.pathway_number || '',
        classOrder: s.classOrder || s.class_order || null,
        latestAssessmentDate: latest ? latest.date : null,
        elementScores,
        finalScore
      };
    });

    res.json({ sectionId, grid, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Error building assessment grid:', error);
    res.status(500).json({ message: 'Error building assessment grid', error: error.message });
  }
});

// GET Excel export: /api/sections/:sectionId/assessment-grid.xlsx?cutoff=...
app.get('/api/sections/:sectionId/assessment-grid.xlsx', async (req, res) => {
  try {
    const Excel = require('exceljs');
    const { sectionId } = req.params;
    const cutoff = req.query.cutoff ? new Date(req.query.cutoff) : null;
    if (!sectionId) return res.status(400).json({ message: 'sectionId is required' });

    const students = await db.Student.findAll({ where: { sectionId } });
    const studentIds = students.map(s => s.id);
    if (studentIds.length === 0) return res.status(200).send('No students in section');

    // Build latest assessments using cutoff if provided
    const assessments = await db.StudentAssessment.findAll({ where: { studentId: studentIds }, order: [['date', 'DESC']] });
    const latestByStudent = {};
    assessments.forEach(a => {
      const ad = new Date(a.date);
      if (cutoff && ad > cutoff) return; // skip assessments after cutoff
      if (!latestByStudent[a.studentId]) latestByStudent[a.studentId] = a;
    });

    const normalizeTo10 = (v) => {
      if (v == null) return null;
      const n = Number(v);
      if (!Number.isFinite(n)) return null;
      if (n <= 1) return Math.round(n * 10 * 100) / 100;
      if (n <= 10) return Math.round(n * 100) / 100;
      if (n <= 100) return Math.round((n / 100) * 10 * 100) / 100;
      return Math.round(Math.max(0, Math.min(10, n)) * 100) / 100;
    };

    // collect all element keys present in latest assessments to create consistent columns
    const allKeys = new Set();
    students.forEach(s => {
      const a = latestByStudent[s.id];
      if (a && a.scores) {
        try {
          const obj = typeof a.scores === 'string' ? JSON.parse(a.scores) : a.scores;
          Object.keys(obj || {}).forEach(k => allKeys.add(k));
        } catch (e) {}
      }
    });

    const keys = Array.from(allKeys);

    // header translations for common keys
    const keyMap = {
      attendance: 'الحضور', attendance_score: 'الحضور', presence: 'الحضور', 'حضور': 'الحضور',
      notebook: 'الدفتر', notebook_score: 'الدفتر', 'دفتر': 'الدفتر',
      homework: 'الواجب', homework_score: 'الواجب', portfolio_score: 'الملف', assignments: 'الواجب',
      behavior: 'السلوك', behavior_score: 'السلوك', 'سلوك': 'السلوك',
      quiz: 'اختبار', test: 'اختبار', project: 'مشروع'
    };

    // Compute max per key using latestByStudent
    const maxPerKey = {};
    keys.forEach(k => { maxPerKey[k] = 0; });
    students.forEach(s => {
      const a = latestByStudent[s.id];
      if (!a || !a.scores) return;
      let obj = {};
      try { obj = typeof a.scores === 'string' ? JSON.parse(a.scores) : a.scores; } catch (e) { obj = a.scores || {}; }
      keys.forEach(k => {
        const val = normalizeTo10(obj[k]);
        if (val != null && val > (maxPerKey[k] || 0)) maxPerKey[k] = val;
      });
    });

    const sumMax = keys.reduce((acc, k) => acc + (maxPerKey[k] || 0), 0);
    const scaleFactor = sumMax > 0 ? (10 / sumMax) : 1;

    const workbook = new Excel.Workbook();
    const sheet = workbook.addWorksheet('شبكة التقييم');

    // Build headers: الرقم (id), الرمز (pathwayNumber), اسم التلميذ, تاريخ آخر تقييم, ...elements..., النقطة النهائية (على 10)
    const headers = ['الرقم', 'الرمز', 'اسم التلميذ', 'تاريخ آخر تقييم', ...keys.map(k => (keyMap[k] || k.replace(/_/g, ' '))), 'النقطة النهائية (على 10)'];
    sheet.addRow(headers);

    // Fill rows with scaled values
    students.forEach(s => {
      const a = latestByStudent[s.id];
      let scoresObj = {};
      if (a && a.scores) {
        try { scoresObj = typeof a.scores === 'string' ? JSON.parse(a.scores) : a.scores; } catch (e) { scoresObj = a.scores || {}; }
      }

      const scaled = keys.map(k => {
        const raw = normalizeTo10(scoresObj[k]);
        if (raw == null) return null;
        return Math.round(raw * scaleFactor * 100) / 100;
      });

      const vals = [s.id, s.pathwayNumber ?? s.pathway_number ?? '', `${s.firstName || ''} ${s.lastName || ''}`.trim(), s.lastName || '', s.classOrder ?? s.class_order ?? '', a ? a.date : ''];
      vals.push(...scaled.map(v => (v == null ? '' : v)));
      const nonNullVals = scaled.filter(v => v != null);
      const finalScore = nonNullVals.length ? Math.round(Math.min(10, nonNullVals.reduce((a, b) => a + b, 0)) * 100) / 100 : '';
      vals.push(finalScore);
      sheet.addRow(vals);
    });

    // adjust column widths
    sheet.columns.forEach(col => { col.width = Math.min(30, Math.max(12, (col.header || '').toString().length + 5)); });

    // send workbook
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="assessment-grid-section-${sectionId}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting assessment grid xlsx:', error);
    res.status(500).json({ message: 'Error exporting xlsx', error: error.message });
  }
});

// GET PDF export: /api/sections/:sectionId/assessment-grid.pdf
app.get('/api/sections/:sectionId/assessment-grid.pdf', async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const { sectionId } = req.params;
    const cutoff = req.query.cutoff ? new Date(req.query.cutoff) : null;
    if (!sectionId) return res.status(400).json({ message: 'sectionId is required' });

    const students = await db.Student.findAll({ where: { sectionId } });
    const studentIds = students.map(s => s.id);
    if (studentIds.length === 0) return res.status(200).send('No students in section');

    // Build latest assessments using cutoff if provided
    const assessments = await db.StudentAssessment.findAll({ where: { studentId: studentIds }, order: [['date', 'DESC']] });
    const latestByStudent = {};
    assessments.forEach(a => {
      const ad = new Date(a.date);
      if (cutoff && ad > cutoff) return;
      if (!latestByStudent[a.studentId]) latestByStudent[a.studentId] = a;
    });

    const normalizeTo10 = (v) => {
      if (v == null) return null;
      const n = Number(v);
      if (!Number.isFinite(n)) return null;
      if (n <= 1) return Math.round(n * 10 * 100) / 100;
      if (n <= 10) return Math.round(n * 100) / 100;
      if (n <= 100) return Math.round((n / 100) * 10 * 100) / 100;
      return Math.round(Math.max(0, Math.min(10, n)) * 100) / 100;
    };

    // Collect all element keys
    const allKeys = new Set();
    students.forEach(s => {
      const a = latestByStudent[s.id];
      if (a && a.scores) {
        try {
          const obj = typeof a.scores === 'string' ? JSON.parse(a.scores) : a.scores;
          Object.keys(obj || {}).forEach(k => allKeys.add(k));
        } catch (e) {}
      }
    });
    const keys = Array.from(allKeys);

    // Key map for Arabic translations
    const keyMap = {
      attendance: 'الحضور', attendance_score: 'الحضور', presence: 'الحضور',
      notebook: 'الدفتر', notebook_score: 'الدفتر',
      homework: 'الواجب', homework_score: 'الواجب', portfolio_score: 'الملف', assignments: 'الواجب',
      behavior: 'السلوك', behavior_score: 'السلوك',
      quiz: 'اختبار', test: 'اختبار', project: 'مشروع'
    };

    // Compute max per key
    const maxPerKey = {};
    keys.forEach(k => { maxPerKey[k] = 0; });
    students.forEach(s => {
      const a = latestByStudent[s.id];
      if (!a || !a.scores) return;
      let obj = {};
      try { obj = typeof a.scores === 'string' ? JSON.parse(a.scores) : a.scores; } catch (e) { obj = a.scores || {}; }
      keys.forEach(k => {
        const val = normalizeTo10(obj[k]);
        if (val != null && val > (maxPerKey[k] || 0)) maxPerKey[k] = val;
      });
    });

    const sumMax = keys.reduce((acc, k) => acc + (maxPerKey[k] || 0), 0);
    const scaleFactor = sumMax > 0 ? (10 / sumMax) : 1;

    // Create PDF
    const doc = new PDFDocument({ bufferPages: true });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="assessment-grid-section-${sectionId}.pdf"`);
    doc.pipe(res);

    // Title
    doc.fontSize(16).text('شبكة التقييم', { align: 'center' });
    doc.fontSize(10).text(`القسم: ${sectionId}`, { align: 'center' });
    doc.fontSize(9).text(`التاريخ: ${new Date().toLocaleDateString('ar-SA')}`, { align: 'center' });
    doc.moveDown();

    // Table headers and data
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    const colCount = 5 + keys.length; // رقم + رمز + اسم + تاريخ + نقطة + عناصر
    const colWidth = contentWidth / colCount;

    doc.fontSize(8);
    let y = doc.y;
    const rowHeight = 20;

    // Headers
    const headers = ['النقطة النهائية', ...keys.reverse().map(k => (keyMap[k] || k)), 'تاريخ آخر تقييم', 'اسم التلميذ', 'الرمز', 'الرقم'];
    let x = pageWidth - margin;
    headers.forEach(h => {
      doc.text(h, x - colWidth, y, { width: colWidth, align: 'right', lineBreak: false });
      x -= colWidth;
    });

    y += rowHeight;
    doc.lineWidth(0.5).moveTo(margin, y).lineTo(pageWidth - margin, y).stroke();
    y += 5;

    // Rows
    students.forEach(s => {
      if (y > pageHeight - margin - 40) {
        doc.addPage();
        y = margin;
      }

      const a = latestByStudent[s.id];
      let scoresObj = {};
      if (a && a.scores) {
        try { scoresObj = typeof a.scores === 'string' ? JSON.parse(a.scores) : a.scores; } catch (e) { scoresObj = a.scores || {}; }
      }

      const scaled = keys.reverse().map(k => {
        const raw = normalizeTo10(scoresObj[k]);
        if (raw == null) return '';
        return Math.round(raw * scaleFactor * 100) / 100;
      });

      const nonNullVals = scaled.filter(v => v !== '');
      const finalScore = nonNullVals.length ? Math.round(Math.min(10, nonNullVals.reduce((a, b) => a + (Number(b) || 0), 0)) * 100) / 100 : '';

      const rowData = [
        finalScore,
        ...scaled,
        a ? new Date(a.date).toLocaleDateString('ar-SA') : '',
        `${s.firstName || ''} ${s.lastName || ''}`.trim(),
        s.pathwayNumber || s.pathway_number || '',
        s.id
      ];

      x = pageWidth - margin;
      rowData.forEach(val => {
        doc.text(String(val), x - colWidth, y, { width: colWidth, align: 'right', lineBreak: false });
        x -= colWidth;
      });

      y += rowHeight;
    });

    doc.end();
  } catch (error) {
    console.error('Error exporting assessment grid pdf:', error);
    res.status(500).json({ message: 'Error exporting pdf', error: error.message });
  }
});

// Pre-migration cleanup for SQLite FK/type changes
const preMigrateCleanup = async () => {
  try {
    // Disable FK checks during cleanup
    await db.sequelize.query('PRAGMA foreign_keys=OFF;');

    // Fetch existing section ids
    const [sectionRows] = await db.sequelize.query('SELECT id FROM Sections;');
    const validIds = Array.isArray(sectionRows) ? sectionRows.map(r => r.id) : [];

    // If there are any valid ids, nullify any student.section_id not matching these
    if (validIds.length > 0) {
      // Build a parameterized IN clause
      const placeholders = validIds.map(() => '?').join(',');
      const sql = `UPDATE Students SET section_id = NULL WHERE section_id IS NOT NULL AND section_id NOT IN (${placeholders});`;
      await db.sequelize.query(sql, { replacements: validIds });
    }

    // Re-enable FK checks
    await db.sequelize.query('PRAGMA foreign_keys=ON;');
  } catch (e) {
    console.warn('preMigrateCleanup warning:', e?.message || e);
  }
};

// Ensure proper unique constraint on Attendances: UNIQUE(studentId, date)
// If an old schema enforced UNIQUE(date) only, rebuild the table safely.
const ensureAttendanceIndexes = async () => {
  try {
    // List indexes on Attendances
    const [indexes] = await db.sequelize.query("PRAGMA index_list('Attendances');");
    let hasBadUniqueOnDate = false;
    for (const idx of indexes) {
      try {
        const [cols] = await db.sequelize.query(`PRAGMA index_info('${idx.name}');`);
        const colNames = cols.map(c => c.name);
        if (idx.unique === 1 && colNames.length === 1 && colNames[0] === 'date') {
          hasBadUniqueOnDate = true;
          break;
        }
      } catch (e) {
        console.warn('Index inspection warning:', idx?.name, e?.message || e);
      }
    }

    if (hasBadUniqueOnDate) {
      console.warn('Detected old UNIQUE(date) on Attendances. Rebuilding table with UNIQUE(studentId, date)...');
      await db.sequelize.query('PRAGMA foreign_keys=OFF;');
      await db.sequelize.transaction(async (t) => {
        // Create new table with correct schema
        await db.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "Attendances_new" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "studentId" INTEGER NOT NULL REFERENCES "Students" ("id"),
            "sectionId" VARCHAR(255) NOT NULL REFERENCES "Sections" ("id"),
            "date" DATE NOT NULL,
            "isPresent" TINYINT(1) NOT NULL DEFAULT 1,
            "createdAt" DATETIME NOT NULL,
            "updatedAt" DATETIME NOT NULL,
            UNIQUE("studentId", "date")
          );
        `, { transaction: t });

        // Copy data from old to new (will respect the new unique; duplicates by date only will be allowed if studentId differs)
        await db.sequelize.query(`
          INSERT OR IGNORE INTO "Attendances_new" (id, studentId, sectionId, date, isPresent, createdAt, updatedAt)
          SELECT id, studentId, sectionId, date, isPresent, createdAt, updatedAt FROM "Attendances";
        `, { transaction: t });

        // Drop old table and rename new
        await db.sequelize.query('DROP TABLE "Attendances";', { transaction: t });
        await db.sequelize.query('ALTER TABLE "Attendances_new" RENAME TO "Attendances";', { transaction: t });
        // Create composite unique index explicitly (optional as UNIQUE is declared)
        await db.sequelize.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_student_date ON Attendances (studentId, date);', { transaction: t });
      });
      await db.sequelize.query('PRAGMA foreign_keys=ON;');
    } else {
      // Ensure composite index exists
      await db.sequelize.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_student_date ON Attendances (studentId, date);');
    }
  } catch (e) {
    console.warn('ensureAttendanceIndexes warning:', e?.message || e);
  }
};

// ====================================
// BACKUP STATUS API
// ====================================

// Backup status endpoint
app.get('/api/backup-status', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Check for backup files in automated_backups directory
    const backupDir = path.join(__dirname, '..', 'automated_backups');
    let lastBackup = null;
    let backupCount = 0;
    let isRunning = false;
    
    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir)
        .filter(file => file.startsWith('auto_backup_'))
        .map(file => {
          const filePath = path.join(backupDir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            path: filePath,
            mtime: stats.mtime
          };
        })
        .sort((a, b) => b.mtime - a.mtime);
      
      backupCount = files.length;
      
      if (files.length > 0) {
        lastBackup = files[0].mtime.toISOString();
        // Consider backup service running if last backup is within 24 hours
        const hoursSinceLastBackup = (Date.now() - files[0].mtime) / (1000 * 60 * 60);
        isRunning = hoursSinceLastBackup < 24;
      }
    }
    
    res.json({
      isRunning,
      lastBackup,
      nextBackup: null, // Can be calculated based on schedule
      backupCount
    });
  } catch (error) {
    console.error('Error fetching backup status:', error);
    res.status(500).json({ 
      error: 'Failed to fetch backup status',
      isRunning: false,
      lastBackup: null,
      nextBackup: null,
      backupCount: 0
    });
  }
});

// Start the server
preMigrateCleanup()
  // Use sync to create tables if they don't exist
  .then(() => db.sequelize.sync({ force: false })) // Don't force recreate, just sync
  .then(async () => {
    // Ensure Students table has featured_works column before other migrations
    await ensureStudentFeaturedWorksColumn();
    // Instead of sequelize.sync({ alter: true }) which may attempt destructive
    // operations on SQLite and trigger FK constraint errors, perform targeted
    // migrations for the StudentAssessments table by adding missing columns.
    const ensureAssessmentColumns = async () => {
      try {
        // Get existing columns for StudentAssessments
        const [cols] = await db.sequelize.query("PRAGMA table_info('StudentAssessments');");
        const existing = Array.isArray(cols) ? cols.map(c => c.name) : [];

        const queries = [];
        if (!existing.includes('scores')) {
          // store JSON as TEXT in SQLite
          queries.push("ALTER TABLE StudentAssessments ADD COLUMN scores TEXT;");
        }
        if (!existing.includes('total_xp')) {
          queries.push("ALTER TABLE StudentAssessments ADD COLUMN total_xp INTEGER;");
        }
        if (!existing.includes('student_level')) {
          queries.push("ALTER TABLE StudentAssessments ADD COLUMN student_level INTEGER;");
        }

        for (const q of queries) {
          try {
            await db.sequelize.query(q);
            console.log('Applied migration:', q);
          } catch (e) {
            console.warn('Failed to apply migration query:', q, e.message || e);
          }
        }
      } catch (e) {
        console.warn('ensureAssessmentColumns warning:', e?.message || e);
      }
    };

    await ensureAssessmentColumns();
  })
  .then(() => ensureAttendanceIndexes())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
      
      // Keep alive mechanism
      setInterval(() => {
        console.log('Server is alive at', new Date().toISOString());
      }, 30000);
    });
  })
  .catch(err => {
    console.error('Failed to start backend after migration:', err);
    process.exit(1);
  });