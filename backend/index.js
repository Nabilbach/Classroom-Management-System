const express = require('express');
const cors = require('cors');
const db = require('./models');
const SequelizeLib = require('sequelize');
const { Op } = require('sequelize');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true, charset: 'utf-8' }));

// Set default charset for responses
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Health & basic endpoints
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString(), pid: process.pid }));

// Attach modular routes (keep the file organized)
try {
  const attendanceRoutes = require('./routes/attendance');
  app.use('/api/attendance', attendanceRoutes);
} catch (e) { /* optional on some envs */ }

// Get students with latest assessment summary (single-query, robust parsing)
app.get('/api/students', async (req, res) => {
  try {
    const { section_id } = req.query;
    const where = section_id ? { sectionId: section_id } : {};
    const students = await db.Student.findAll({ where });

    const studentIds = (students || []).map(s => s.id).filter(Boolean);
    let latestMap = {};
    if (studentIds.length > 0) {
      // Fetch recent assessments for these students in one query, ordered by date desc
      const assessments = await db.StudentAssessment.findAll({
        where: { studentId: { [Op.in]: studentIds } },
        order: [['date', 'DESC']],
      });
      for (const a of assessments) {
        if (!latestMap[a.studentId]) latestMap[a.studentId] = a.toJSON ? a.toJSON() : a;
      }
    }

    const studentsWithScores = students.map(student => {
      const base = student.toJSON ? student.toJSON() : student;
      const latest = latestMap[student.id];
      let lastAssessmentDate = null;
      let score = 0;
      let total_xp = 0;
      if (latest) {
        lastAssessmentDate = latest.date || null;
        score = typeof latest.new_score !== 'undefined' ? Number(latest.new_score) : 0;
        let parsed = null;
        if (latest.scores && typeof latest.scores === 'string') {
          try { parsed = JSON.parse(latest.scores); } catch (e) { parsed = null; }
        } else if (latest.scores && typeof latest.scores === 'object') {
          parsed = latest.scores;
        }
        if (parsed) {
          const sliderSum = (parsed.behavior_score ?? 0) + (parsed.participation_score ?? 0) + (parsed.notebook_score ?? 0) + (parsed.attendance_score ?? 0) + (parsed.portfolio_score ?? 0);
          const sliderXP = sliderSum * 10;
          const quranXP = (parsed.quran_memorization ?? 0) * 10;
          const bonusXP = (parsed.bonus_points ?? 0) * 5;
          total_xp = sliderXP + quranXP + bonusXP;
        } else {
          total_xp = Number(latest.new_score) || 0;
        }
      }
      return { ...base, score, lastAssessmentDate, total_xp };
    });

    res.json(studentsWithScores);
  } catch (error) {
    console.error('Error retrieving students:', error);
    res.status(500).json({ message: 'Error retrieving students', error: error.message, stack: error.stack });
  }
});

// --- Remaining API routes -------------------------------------------------

app.delete('/api/lessons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.Lesson.destroy({ where: { id } });
    if (deleted) return res.status(204).send();
    res.status(404).json({ message: 'Lesson not found' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting lesson', error: error.message, stack: error.stack });
  }
});

// Lesson logs
app.get('/api/lesson-logs', async (req, res) => {
  try { res.json(await db.LessonLog.findAll()); } catch (e) { res.status(500).json({ message: 'Error retrieving lesson logs', error: e.message }); }
});
app.post('/api/lesson-logs', async (req, res) => { try { const newLog = await db.LessonLog.create({ id: Date.now().toString(), ...req.body }); res.status(201).json(newLog); } catch (e) { res.status(500).json({ message: 'Error creating lesson log', error: e.message }); } });

// Sections management
app.delete('/api/sections/all', async (req, res) => {
  try { await db.Section.destroy({ truncate: true }); res.status(204).send(); } catch (e) { console.error('Error deleting all sections:', e); res.status(500).json({ message: 'Error deleting all sections', error: e.message }); }
});

app.delete('/api/sections/:id/students', async (req, res) => {
  try { const { id } = req.params; const deleted = await db.Student.destroy({ where: { sectionId: id } }); res.json({ message: `Deleted ${deleted} students from section ${id}`, deletedCount: deleted }); } catch (e) { console.error('Error deleting students by section:', e); res.status(500).json({ message: 'Error deleting students by section', error: e.message }); }
});

// Students CRUD (create + bulk + update + delete)
app.post('/api/students', async (req, res) => {
  try {
    const s = req.body || {};
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

    if (!firstName || !lastName) return res.status(400).json({ message: 'firstName and lastName are required.' });
    const payload = { firstName, lastName, pathwayNumber, birthDate, classOrder, gender, sectionId };
    const newStudent = await db.Student.create(payload);
    res.status(201).json(newStudent);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') return res.status(400).json({ message: 'Duplicate pathway number detected. Ensure pathwayNumber is unique or blank.', error: error.message });
    const errMsg = `${error?.message || ''} ${error?.original?.message || ''}`;
    if (error instanceof SequelizeLib.ForeignKeyConstraintError || error.name === 'SequelizeForeignKeyConstraintError' || /FOREIGN KEY constraint failed/i.test(errMsg)) return res.status(400).json({ message: 'Invalid sectionId. Please choose an existing section.', error: error.message });
    res.status(500).json({ message: 'Error creating student', error: error.message });
  }
});

app.post('/api/students/bulk', async (req, res) => {
  const rawStudents = req.body;
  if (!rawStudents || !Array.isArray(rawStudents)) return res.status(400).json({ message: 'Invalid request body. Expected an array of students.' });
  const transaction = await db.sequelize.transaction();
  try {
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
    const invalid = students.filter((s) => !s.firstName || !s.lastName);
    if (invalid.length > 0) return res.status(400).json({ message: 'Missing required student fields (firstName, lastName) in one or more records.' });
    const pathwayNumbers = students.map((s) => s.pathwayNumber).filter(Boolean);
    const duplicatePathwayNumbers = pathwayNumbers.filter((item, index) => pathwayNumbers.indexOf(item) !== index);
    if (duplicatePathwayNumbers.length > 0) return res.status(400).json({ message: `Duplicate pathway numbers found in the request: ${duplicatePathwayNumbers.join(', ')}` });
    if (pathwayNumbers.length > 0) {
      const existingStudents = await db.Student.findAll({ where: { pathwayNumber: { [Op.in]: pathwayNumbers } } });
      if (existingStudents.length > 0) return res.status(400).json({ message: `The following pathway numbers already exist in the database: ${existingStudents.map(s => s.pathwayNumber).join(', ')}` });
    }
    const newStudents = await db.Student.bulkCreate(students, { transaction });
    await transaction.commit();
    res.status(201).json(newStudents);
  } catch (error) {
    await transaction.rollback();
    console.error('Error during bulk student creation:', error);
    if (error.name === 'SequelizeUniqueConstraintError') return res.status(400).json({ message: 'Duplicate pathway number detected. Ensure all pathway numbers are unique or blank.', error: error.message });
    if (error.name === 'SequelizeForeignKeyConstraintError') return res.status(400).json({ message: 'One or more students refer to a non-existent section. Please ensure all section IDs are valid.', error: error.message });
    res.status(500).json({ message: 'Error creating students', error: error.message });
  }
});

app.put('/api/students/:id', async (req, res) => { try { const { id } = req.params; const [updated] = await db.Student.update(req.body, { where: { id } }); if (updated) { const updatedStudent = await db.Student.findByPk(id); res.json(updatedStudent); } else res.status(404).json({ message: 'Student not found' }); } catch (error) { res.status(500).json({ message: 'Error updating student', error: error.message }); } });

app.delete('/api/students/:id', async (req, res) => { try { const { id } = req.params; const deleted = await db.Student.destroy({ where: { id } }); if (deleted) return res.status(204).send(); res.status(404).json({ message: 'Student not found' }); } catch (error) { res.status(500).json({ message: 'Error deleting student', error: error.message }); } });

app.delete('/api/students/all', async (req, res) => { try { await db.Student.destroy({ truncate: true }); res.status(204).send(); } catch (error) { console.error('Error deleting all students:', error); res.status(500).json({ message: 'Error deleting all students', error: error.message }); } });

app.patch('/api/students/reorder', async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) return res.status(400).json({ message: 'orderedIds must be an array' });
    for (let i = 0; i < orderedIds.length; i++) await db.Student.update({ classOrder: i + 1 }, { where: { id: orderedIds[i] } });
    res.json({ message: 'Students reordered successfully' });
  } catch (error) { console.error('Error reordering students:', error); res.status(500).json({ message: 'Error reordering students', error: error.message }); }
});

// Student assessments routes
const getCurrentScore = async (studentId) => {
  try { const last = await db.StudentAssessment.findOne({ where: { studentId }, order: [['date', 'DESC']] }); return last ? last.new_score : 0; } catch (e) { console.error('getCurrentScore error', e); return 0; }
};

app.post('/api/students/:studentId/assessment', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { new_score, notes, scores, total_xp, student_level } = req.body;
    const old_score = await getCurrentScore(studentId);
    const score_change = (typeof new_score === 'number' ? new_score : 0) - (old_score || 0);
    const newAssessment = await db.StudentAssessment.create({
      studentId,
      date: new Date().toISOString(),
      old_score,
      new_score,
      score_change,
      notes,
      scores: scores && typeof scores === 'object' ? JSON.stringify(scores) : (typeof scores === 'string' ? scores : null),
      total_xp: typeof total_xp === 'number' ? total_xp : null,
      student_level: typeof student_level === 'number' ? student_level : null,
    });
    res.status(201).json(newAssessment);
  } catch (error) { console.error('Error creating assessment', error); res.status(500).json({ message: 'Error creating assessment', error: error.message }); }
});

app.get('/api/students/:studentId/assessments', async (req, res) => {
  try {
    const { studentId } = req.params;
    const assessments = await db.StudentAssessment.findAll({ where: { studentId }, order: [['date', 'DESC']] });
    const normalized = (Array.isArray(assessments) ? assessments : []).map(a => { const obj = a.toJSON ? a.toJSON() : a; if (obj && obj.scores && typeof obj.scores === 'string') { try { obj.scores = JSON.parse(obj.scores); } catch (e) {} } return obj; });
    res.json(normalized);
  } catch (error) { console.error('Error retrieving assessments', error); res.status(500).json({ message: 'Error retrieving assessments', error: error.message }); }
});

app.post('/api/students/:studentId/assessments/delete-bulk', async (req, res) => { try { const { studentId } = req.params; const ids = Array.isArray(req.body && req.body.ids) ? req.body.ids : []; if (!ids || ids.length === 0) return res.status(400).json({ message: 'Missing ids array in request body' }); const existing = await db.StudentAssessment.findAll({ where: { id: ids, studentId } }); const existingIds = existing.map(a => a.id); if (existingIds.length === 0) return res.json({ deletedCount: 0, deletedIds: [] }); const deleted = await db.StudentAssessment.destroy({ where: { id: existingIds } }); res.json({ deletedCount: Number(deleted || 0), deletedIds: existingIds }); } catch (error) { console.error('Error in bulk delete student assessments:', error); res.status(500).json({ message: 'Error deleting assessments', error: error.message }); } });

app.post('/api/students/:studentId/assessments/reset', async (req, res) => { try { const { studentId } = req.params; const assessments = await db.StudentAssessment.findAll({ where: { studentId } }); if (!Array.isArray(assessments) || assessments.length === 0) return res.json({ deletedCount: 0, deletedIds: [] }); const ids = assessments.map(a => a.id); const deleted = await db.StudentAssessment.destroy({ where: { id: ids } }); res.json({ deletedCount: Number(deleted || 0), deletedIds: ids }); } catch (error) { console.error('Error resetting assessments for student:', error); res.status(500).json({ message: 'Error resetting assessments', error: error.message }); } });

app.post('/api/assessments/bulk-delete', async (req, res) => { try { const ids = Array.isArray(req.body && req.body.ids) ? req.body.ids : []; if (!ids || ids.length === 0) return res.status(400).json({ message: 'Missing ids array in request body' }); const existing = await db.StudentAssessment.findAll({ where: { id: ids } }); const existingIds = existing.map(a => a.id); if (existingIds.length === 0) return res.json({ deletedCount: 0, deletedIds: [] }); const deleted = await db.StudentAssessment.destroy({ where: { id: existingIds } }); res.json({ deletedCount: Number(deleted || 0), deletedIds: existingIds }); } catch (error) { console.error('Error in global bulk delete assessments:', error); res.status(500).json({ message: 'Error deleting assessments', error: error.message }); } });

// FollowUp routes (use snake_case for DB columns, normalize to camelCase in responses)
app.get('/api/students/:studentId/followups', async (req, res) => {
  try {
    const { studentId } = req.params;
    const replacements = [studentId ?? null];
    const [rows] = await db.sequelize.query('SELECT id, student_id as studentId, section_id as sectionId, type, notes, is_open as isOpen, createdAt, updatedAt FROM FollowUps WHERE student_id = ? ORDER BY createdAt DESC', { replacements });
    res.json(rows);
  } catch (error) { console.error('Error retrieving followups for student:', error); res.status(500).json({ message: 'Error retrieving followups', error: error.message }); }
});

app.post('/api/students/:studentId/followups', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { type } = req.body || {};
    const notes = (req.body && (req.body.notes ?? req.body.description)) ?? null;
    const student = await db.Student.findByPk(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const sectionId = student.sectionId != null ? student.sectionId : null;
    const typeSafe = type != null ? type : null;
    const notesSafe = notes != null ? notes : null;
    const now = new Date().toISOString();
    const replacements = [studentId ?? null, sectionId ?? null, typeSafe ?? null, notesSafe ?? null, now, now];
    await db.sequelize.query('INSERT INTO FollowUps (student_id, section_id, type, notes, is_open, createdAt, updatedAt) VALUES (?, ?, ?, ?, 1, ?, ?);', { replacements });
    const [[{ lastId }]] = await db.sequelize.query('SELECT last_insert_rowid() as lastId');
    const [rows] = await db.sequelize.query('SELECT id, student_id as studentId, section_id as sectionId, type, notes, is_open as isOpen, createdAt, updatedAt FROM FollowUps WHERE id = ?', { replacements: [lastId ?? null] });
    res.status(201).json(rows[0] || null);
  } catch (error) { console.error('Error creating followup:', error); res.status(500).json({ message: 'Error creating followup', error: error.message }); }
});

app.patch('/api/followups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, is_open } = req.body || {};
    let openFlag = null;
    if (typeof is_open !== 'undefined') openFlag = Number(is_open) ? 1 : 0;
    else if (typeof status === 'string') openFlag = status.toLowerCase() === 'closed' ? 0 : 1;
    else openFlag = null;
    if (openFlag === null) return res.status(400).json({ message: 'Invalid payload' });
    await db.sequelize.query('UPDATE FollowUps SET is_open = ? WHERE id = ?', { replacements: [openFlag, id] });
    const [rows] = await db.sequelize.query('SELECT id, student_id as studentId, section_id as sectionId, type, notes, is_open as isOpen, createdAt, updatedAt FROM FollowUps WHERE id = ?', { replacements: [id] });
    if (!rows || rows.length === 0) return res.status(404).json({ message: 'Followup not found' });
    res.json(rows[0]);
  } catch (error) { console.error('Error updating followup:', error); res.status(500).json({ message: 'Error updating followup', error: error.message }); }
});

app.patch('/api/students/:studentId/followups/:id/close', async (req, res) => {
  try {
    const { studentId, id } = req.params;
    const replacements = [id ?? null, studentId ?? null];
    await db.sequelize.query('UPDATE FollowUps SET is_open = 0 WHERE id = ? AND student_id = ?', { replacements });
    const [rows] = await db.sequelize.query('SELECT id, student_id as studentId, section_id as sectionId, type, notes, is_open as isOpen, createdAt, updatedAt FROM FollowUps WHERE id = ?', { replacements: [id ?? null] });
    if (!rows || rows.length === 0) return res.status(404).json({ message: 'Followup not found' });
    res.json(rows[0]);
  } catch (error) { console.error('Error closing followup:', error); res.status(500).json({ message: 'Error closing followup', error: error.message }); }
});

app.get('/api/sections/:sectionId/followups-count', async (req, res) => { try { const { sectionId } = req.params; const [[{ count }]] = await db.sequelize.query('SELECT COUNT(1) as count FROM FollowUps WHERE section_id = ? AND is_open = 1', { replacements: [sectionId ?? null] }); res.json({ count: Number(count || 0) }); } catch (error) { console.error('Error getting followup count for section:', error); res.status(500).json({ message: 'Error getting followup count', error: error.message }); } });

app.get('/api/sections/:sectionId/followups-students', async (req, res) => { try { const { sectionId } = req.params; const [rows] = await db.sequelize.query('SELECT student_id as studentId, COUNT(1) as followupCount FROM FollowUps WHERE section_id = ? AND is_open = 1 GROUP BY student_id', { replacements: [sectionId ?? null] }); const ids = rows.map(r => r.studentId).filter(Boolean); if (ids.length === 0) return res.json([]); const students = await db.Student.findAll({ where: { id: ids } }); const result = students.map(s => ({ id: s.id, firstName: s.firstName, lastName: s.lastName, followupCount: (rows.find(r => Number(r.studentId) === Number(s.id)) || {}).followupCount || 0 })); res.json(result); } catch (error) { console.error('Error getting followup students for section:', error); res.status(500).json({ message: 'Error getting followup students', error: error.message }); } });

// Database helpers: pre-migration and schema fixes
const preMigrateCleanup = async () => {
  try {
    await db.sequelize.query('PRAGMA foreign_keys=OFF;');
    const [sectionRows] = await db.sequelize.query('SELECT id FROM Sections;');
    const validIds = Array.isArray(sectionRows) ? sectionRows.map(r => r.id) : [];
    if (validIds.length > 0) {
      const placeholders = validIds.map(() => '?').join(',');
      const sql = `UPDATE Students SET section_id = NULL WHERE section_id IS NOT NULL AND section_id NOT IN (${placeholders});`;
      await db.sequelize.query(sql, { replacements: validIds });
    }
    await db.sequelize.query('PRAGMA foreign_keys=ON;');
  } catch (e) { console.warn('preMigrateCleanup warning:', e?.message || e); }
};

const ensureAttendanceIndexes = async () => {
  try {
    const [indexes] = await db.sequelize.query("PRAGMA index_list('Attendances');");
    let hasBadUniqueOnDate = false;
    for (const idx of indexes) {
      try {
        const [cols] = await db.sequelize.query(`PRAGMA index_info('${idx.name}');`);
        const colNames = cols.map(c => c.name);
        if (idx.unique === 1 && colNames.length === 1 && colNames[0] === 'date') { hasBadUniqueOnDate = true; break; }
      } catch (e) { console.warn('Index inspection warning:', idx?.name, e?.message || e); }
    }
    if (hasBadUniqueOnDate) {
      console.warn('Detected old UNIQUE(date) on Attendances. Rebuilding table with UNIQUE(studentId, date)...');
      await db.sequelize.query('PRAGMA foreign_keys=OFF;');
      await db.sequelize.transaction(async (t) => {
        await db.sequelize.query(`CREATE TABLE IF NOT EXISTS "Attendances_new" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "studentId" INTEGER NOT NULL REFERENCES "Students" ("id"), "sectionId" VARCHAR(255) NOT NULL REFERENCES "Sections" ("id"), "date" DATE NOT NULL, "isPresent" TINYINT(1) NOT NULL DEFAULT 1, "createdAt" DATETIME NOT NULL, "updatedAt" DATETIME NOT NULL, UNIQUE("studentId", "date"));`, { transaction: t });
        await db.sequelize.query(`INSERT OR IGNORE INTO "Attendances_new" (id, studentId, sectionId, date, isPresent, createdAt, updatedAt) SELECT id, studentId, sectionId, date, isPresent, createdAt, updatedAt FROM "Attendances";`, { transaction: t });
        await db.sequelize.query('DROP TABLE "Attendances";', { transaction: t });
        await db.sequelize.query('ALTER TABLE "Attendances_new" RENAME TO "Attendances";', { transaction: t });
        await db.sequelize.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_student_date ON Attendances (studentId, date);', { transaction: t });
      });
      await db.sequelize.query('PRAGMA foreign_keys=ON;');
    } else {
      await db.sequelize.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_student_date ON Attendances (studentId, date);');
    }
  } catch (e) { console.warn('ensureAttendanceIndexes warning:', e?.message || e); }
};

const ensureFollowupSchema = async () => {
  try {
    const [cols] = await db.sequelize.query("PRAGMA table_info('FollowUps');");
    const existing = Array.isArray(cols) ? cols.map(c => c.name) : [];
    if (existing.length === 0) {
      await db.sequelize.query(`CREATE TABLE IF NOT EXISTS "FollowUps" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "student_id" INTEGER, "section_id" VARCHAR(255), "type" VARCHAR(255), "notes" TEXT, "is_open" TINYINT(1) DEFAULT 1, "createdAt" DATETIME, "updatedAt" DATETIME);`);
      return;
    }
    const addIfMissing = async (colName, colDef) => { if (!existing.includes(colName)) await db.sequelize.query(`ALTER TABLE "FollowUps" ADD COLUMN "${colName}" ${colDef};`); };
    await addIfMissing('student_id', 'INTEGER');
    await addIfMissing('section_id', 'VARCHAR(255)');
    await addIfMissing('type', 'VARCHAR(255)');
    await addIfMissing('notes', 'TEXT');
    await addIfMissing('is_open', 'TINYINT(1) DEFAULT 1');
  } catch (e) { console.warn('ensureFollowupSchema warning:', e?.message || e); }
};

// Start the server and run pre-migration tasks
preMigrateCleanup()
  .then(() => db.sequelize.sync({ force: false }))
  .then(() => ensureAttendanceIndexes())
  .then(() => ensureFollowupSchema())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
      setInterval(() => console.log('Server is alive at', new Date().toISOString()), 30000);
    });
  })
  .catch(err => { console.error('Failed to start backend after migration:', err); process.exit(1); });

app.get('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const student = await db.Student.findByPk(id);
    if (student) {
      const score = await getCurrentScore(student.id);
      res.json({ ...student.toJSON(), score });
    } else {
      res.status(404).json({ message: 'Student not found' });
    }
  } catch (error) {
    console.error('Error retrieving student:', error);
    res.status(500).json({ message: 'Error retrieving student', error: error.message, stack: error.stack });
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
      return res.status(400).json({ message: 'firstName and lastName are required.' });
    }
    const payload = { firstName, lastName, pathwayNumber, birthDate, classOrder, gender, sectionId };
    const newStudent = await db.Student.create(payload);
    res.status(201).json(newStudent);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Duplicate pathway number detected. Ensure pathwayNumber is unique or blank.', error: error.message, stack: error.stack });
    }
    const errMsg = `${error?.message || ''} ${error?.original?.message || ''}`;
    if (error instanceof SequelizeLib.ForeignKeyConstraintError || error.name === 'SequelizeForeignKeyConstraintError' || /FOREIGN KEY constraint failed/i.test(errMsg)) {
      return res.status(400).json({ message: 'Invalid sectionId. Please choose an existing section.', error: error.message, stack: error.stack });
    }
    res.status(500).json({ message: 'Error creating student', error: error.message, stack: error.stack });
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
    const deleted = await db.Student.destroy({ where: { id } });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Student not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting student', error: error.message, stack: error.stack });
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
    const { new_score, notes, scores } = req.body;

    const old_score = await getCurrentScore(studentId);
    const score_change = new_score - old_score;

    const newAssessment = await db.StudentAssessment.create({
      studentId,
      date: new Date().toISOString(),
      old_score,
      new_score,
      score_change,
      notes,
      scores: scores && typeof scores === 'object' ? JSON.stringify(scores) : (typeof scores === 'string' ? scores : null),
    });

    res.status(201).json(newAssessment);
  } catch (error) {
    res.status(500).json({ message: 'Error creating assessment', error: error.message, stack: error.stack });
  }
});

app.get('/api/students/:studentId/assessments', async (req, res) => {
  try {
    const { studentId } = req.params;
    const assessments = await db.StudentAssessment.findAll({ 
      where: { studentId },
      order: [[ 'date', 'DESC' ]],
    });
    const normalized = (Array.isArray(assessments) ? assessments : []).map(a => {
      const obj = a.toJSON ? a.toJSON() : a;
      if (obj && obj.scores && typeof obj.scores === 'string') {
        try { obj.scores = JSON.parse(obj.scores); } catch (e) { /* leave as string */ }
      }
      return obj;
    });
    res.json(normalized);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving assessments', error: error.message, stack: error.stack });
  }
});

// Bulk delete assessments for a student: accepts { ids: [ ... ] }
app.post('/api/students/:studentId/assessments/delete-bulk', async (req, res) => {
  try {
    const { studentId } = req.params;
    const ids = Array.isArray(req.body && req.body.ids) ? req.body.ids : [];
    if (!ids || ids.length === 0) return res.status(400).json({ message: 'Missing ids array in request body' });

    // Find which ids actually exist and belong to the student
    const existing = await db.StudentAssessment.findAll({ where: { id: ids, studentId } });
    const existingIds = existing.map(a => a.id);

    if (existingIds.length === 0) return res.json({ deletedCount: 0, deletedIds: [] });

    const deleted = await db.StudentAssessment.destroy({ where: { id: existingIds } });
    res.json({ deletedCount: Number(deleted || 0), deletedIds: existingIds });
  } catch (error) {
    console.error('Error in bulk delete student assessments:', error);
    res.status(500).json({ message: 'Error deleting assessments', error: error.message, stack: error.stack });
  }
});

// Reset all assessments for a student (convenience endpoint used by QuickEvaluation)
app.post('/api/students/:studentId/assessments/reset', async (req, res) => {
  try {
    const { studentId } = req.params;
    const assessments = await db.StudentAssessment.findAll({ where: { studentId } });
    if (!Array.isArray(assessments) || assessments.length === 0) return res.json({ deletedCount: 0, deletedIds: [] });
    const ids = assessments.map(a => a.id);
    const deleted = await db.StudentAssessment.destroy({ where: { id: ids } });
    res.json({ deletedCount: Number(deleted || 0), deletedIds: ids });
  } catch (error) {
    console.error('Error resetting assessments for student:', error);
    res.status(500).json({ message: 'Error resetting assessments', error: error.message, stack: error.stack });
  }
});

// Global bulk delete endpoint: accepts { ids: [ ... ] }
app.post('/api/assessments/bulk-delete', async (req, res) => {
  try {
    const ids = Array.isArray(req.body && req.body.ids) ? req.body.ids : [];
    if (!ids || ids.length === 0) return res.status(400).json({ message: 'Missing ids array in request body' });

    const existing = await db.StudentAssessment.findAll({ where: { id: ids } });
    const existingIds = existing.map(a => a.id);
    if (existingIds.length === 0) return res.json({ deletedCount: 0, deletedIds: [] });

    const deleted = await db.StudentAssessment.destroy({ where: { id: existingIds } });
    res.json({ deletedCount: Number(deleted || 0), deletedIds: existingIds });
  } catch (error) {
    console.error('Error in global bulk delete assessments:', error);
    res.status(500).json({ message: 'Error deleting assessments', error: error.message, stack: error.stack });
  }
});

// FollowUp routes
app.get('/api/students/:studentId/followups', async (req, res) => {
  try {
    const { studentId } = req.params;
    const replacements = [studentId ?? null];
    const [rows] = await db.sequelize.query('SELECT id, student_id as studentId, section_id as sectionId, type, notes, is_open as isOpen, createdAt, updatedAt FROM FollowUps WHERE student_id = ? ORDER BY createdAt DESC', { replacements });
    res.json(rows);
  } catch (error) {
    console.error('Error retrieving followups for student:', error);
    res.status(500).json({ message: 'Error retrieving followups', error: error.message, stack: error.stack });
  }
});

app.post('/api/students/:studentId/followups', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { type } = req.body || {};
    // accept either notes or description from frontend
    const notes = (req.body && (req.body.notes ?? req.body.description)) ?? null;
    const student = await db.Student.findByPk(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Normalize values so replacements array doesn't contain `undefined` (which Sequelize rejects)
  const sectionId = student.sectionId != null ? student.sectionId : null;
  const typeSafe = type != null ? type : null;
  const notesSafe = notes != null ? notes : null;

    const now = new Date().toISOString();
    // sanitize replacements: Sequelize throws if a positional replacement is undefined
    const replacements = [studentId ?? null, sectionId ?? null, typeSafe ?? null, notesSafe ?? null, now, now];
    await db.sequelize.query('INSERT INTO FollowUps (student_id, section_id, type, notes, is_open, createdAt, updatedAt) VALUES (?, ?, ?, ?, 1, ?, ?);', { replacements });
    // Fetch created row id
    const [[{ lastId }]] = await db.sequelize.query('SELECT last_insert_rowid() as lastId');
    const [rows] = await db.sequelize.query('SELECT id, student_id as studentId, section_id as sectionId, type, notes, is_open as isOpen, createdAt, updatedAt FROM FollowUps WHERE id = ?', { replacements: [lastId ?? null] });
    res.status(201).json(rows[0] || null);
  } catch (error) {
    console.error('Error creating followup:', error);
    res.status(500).json({ message: 'Error creating followup', error: error.message, stack: error.stack });
  }
});

// Close or update followup by id (compatible with frontend PATCH /api/followups/:id)
app.patch('/api/followups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // support body like { status: 'closed' } or { is_open: 0 }
    const { status, is_open } = req.body || {};
    let openFlag = null;
    if (typeof is_open !== 'undefined') openFlag = Number(is_open) ? 1 : 0;
    else if (typeof status === 'string') openFlag = status.toLowerCase() === 'closed' ? 0 : 1;
    else openFlag = null;

    if (openFlag === null) return res.status(400).json({ message: 'Invalid payload' });

    await db.sequelize.query('UPDATE FollowUps SET is_open = ? WHERE id = ?', { replacements: [openFlag, id] });
    const [rows] = await db.sequelize.query('SELECT id, student_id as studentId, section_id as sectionId, type, notes, is_open as isOpen, createdAt, updatedAt FROM FollowUps WHERE id = ?', { replacements: [id] });
    if (!rows || rows.length === 0) return res.status(404).json({ message: 'Followup not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating followup:', error);
    res.status(500).json({ message: 'Error updating followup', error: error.message, stack: error.stack });
  }
});

app.patch('/api/students/:studentId/followups/:id/close', async (req, res) => {
  try {
    const { studentId, id } = req.params;
    const replacements = [id ?? null, studentId ?? null];
    const [result] = await db.sequelize.query('UPDATE FollowUps SET is_open = 0 WHERE id = ? AND student_id = ?', { replacements });
    const [rows] = await db.sequelize.query('SELECT id, student_id as studentId, section_id as sectionId, type, notes, is_open as isOpen, createdAt, updatedAt FROM FollowUps WHERE id = ?', { replacements: [id ?? null] });
    if (!rows || rows.length === 0) return res.status(404).json({ message: 'Followup not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error closing followup:', error);
    res.status(500).json({ message: 'Error closing followup', error: error.message, stack: error.stack });
  }
});

app.get('/api/sections/:sectionId/followups-count', async (req, res) => {
  try {
    const { sectionId } = req.params;
    const replacements = [sectionId ?? null];
    const [[{ count }]] = await db.sequelize.query('SELECT COUNT(1) as count FROM FollowUps WHERE section_id = ? AND is_open = 1', { replacements });
    res.json({ count: Number(count || 0) });
  } catch (error) {
    console.error('Error getting followup count for section:', error);
    res.status(500).json({ message: 'Error getting followup count', error: error.message, stack: error.stack });
  }
});

app.get('/api/sections/:sectionId/followups-students', async (req, res) => {
  try {
    const { sectionId } = req.params;
    // Return students in that section who have open followups with counts
    const replacements = [sectionId ?? null];
    const [rows] = await db.sequelize.query('SELECT student_id as studentId, COUNT(1) as followupCount FROM FollowUps WHERE section_id = ? AND is_open = 1 GROUP BY student_id', { replacements });
    const ids = rows.map(r => r.studentId).filter(Boolean);
    if (ids.length === 0) return res.json([]);
    const students = await db.Student.findAll({ where: { id: ids } });
    const result = students.map(s => ({ id: s.id, firstName: s.firstName, lastName: s.lastName, followupCount: (rows.find(r => Number(r.studentId) === Number(s.id)) || {}).followupCount || 0 }));
    res.json(result);
  } catch (error) {
    console.error('Error getting followup students for section:', error);
    res.status(500).json({ message: 'Error getting followup students', error: error.message, stack: error.stack });
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

// Ensure FollowUps table exists and has expected columns
const ensureFollowupSchema = async () => {
  try {
    const [cols] = await db.sequelize.query("PRAGMA table_info('FollowUps');");
    const existing = Array.isArray(cols) ? cols.map(c => c.name) : [];
    if (existing.length === 0) {
      // table doesn't exist, create it
      await db.sequelize.query(`
        CREATE TABLE IF NOT EXISTS "FollowUps" (
          "id" INTEGER PRIMARY KEY AUTOINCREMENT,
          "student_id" INTEGER,
          "section_id" VARCHAR(255),
          "type" VARCHAR(255),
          "notes" TEXT,
          "is_open" TINYINT(1) DEFAULT 1,
          "createdAt" DATETIME,
          "updatedAt" DATETIME
        );
      `);
      return;
    }

    // Add missing columns if any
    const addIfMissing = async (colName, colDef) => {
      if (!existing.includes(colName)) {
        await db.sequelize.query(`ALTER TABLE "FollowUps" ADD COLUMN "${colName}" ${colDef};`);
      }
    };

  await addIfMissing('student_id', 'INTEGER');
  await addIfMissing('section_id', 'VARCHAR(255)');
  await addIfMissing('type', 'VARCHAR(255)');
  await addIfMissing('notes', 'TEXT');
  await addIfMissing('is_open', 'TINYINT(1) DEFAULT 1');
  } catch (e) {
    console.warn('ensureFollowupSchema warning:', e?.message || e);
  }
};

// Start the server
preMigrateCleanup()
  // Use sync to create tables if they don't exist
  .then(() => db.sequelize.sync({ force: false })) // Don't force recreate, just sync
  .then(() => ensureAttendanceIndexes())
  .then(() => ensureFollowupSchema())
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