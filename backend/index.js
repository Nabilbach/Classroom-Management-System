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

// Routes
const attendanceRoutes = require('./routes/attendance');
app.use('/api/attendance', attendanceRoutes);
// Scheduled lessons API
const scheduledLessonsRoutes = require('./routes/scheduledLessons');
app.use('/api/scheduled-lessons', scheduledLessonsRoutes);
// Section statistics API
const sectionStatsRoutes = require('./routes/sectionStats');
app.use('/api/sections/stats', sectionStatsRoutes);

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

    // Get all scores at once instead of individual queries
    const studentIds = students.map(student => student.id);
    const scores = await db.StudentAssessment.findAll({
      where: { studentId: studentIds },
      order: [['date', 'DESC']],
      group: ['studentId']
    });

    const scoreMap = {};
    scores.forEach(assessment => {
      if (!scoreMap[assessment.studentId]) {
        scoreMap[assessment.studentId] = assessment.new_score;
      }
    });

    const studentsWithScores = students.map(student => ({
      ...student.toJSON(),
      score: scoreMap[student.id] || 0
    }));

    res.json(studentsWithScores);
  } catch (error) {
    console.error('Error retrieving students:', error);
    res.status(500).json({ message: 'Error retrieving students', error: error.message, stack: error.stack });
  }
});

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
    const { new_score, notes } = req.body;

    const old_score = await getCurrentScore(studentId);
    const score_change = new_score - old_score;

    const newAssessment = await db.StudentAssessment.create({
      studentId,
      date: new Date().toISOString(),
      old_score,
      new_score,
      score_change,
      notes,
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
    res.json(assessments);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving assessments', error: error.message, stack: error.stack });
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

// Start the server
preMigrateCleanup()
  // Use sync to create tables if they don't exist
  .then(() => db.sequelize.sync({ force: false })) // Don't force recreate, just sync
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