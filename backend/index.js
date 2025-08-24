const express = require('express');
const cors = require('cors');
const db = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

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
    const lessons = await db.Lesson.findAll();
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
    res.status(500).json({ message: 'Error deleting section', error: error.message, stack: error.stack });
  }
});

// Routes for Students
app.get('/api/students', async (req, res) => {
  try {
    const { section_id } = req.query;
    const where = section_id ? { sectionId: section_id } : {};
    const students = await db.Student.findAll({ where });

    const studentsWithScores = await Promise.all(students.map(async (student) => {
      const score = await getCurrentScore(student.id);
      return { ...student.toJSON(), score };
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
    const newStudent = await db.Student.create(req.body);
    res.status(201).json(newStudent);
  } catch (error) {
    res.status(500).json({ message: 'Error creating student', error: error.message, stack: error.stack });
  }
});

app.post('/api/students/bulk', async (req, res) => {
  const students = req.body;
  if (!students || !Array.isArray(students)) {
    return res.status(400).json({ message: 'Invalid request body. Expected an array of students.' });
  }

  const transaction = await db.sequelize.transaction();

  try {
    // Check for duplicate pathway numbers within the payload
    const pathwayNumbers = students.map(s => s.pathway_number);
    const duplicatePathwayNumbers = pathwayNumbers.filter((item, index) => pathwayNumbers.indexOf(item) !== index);
    if (duplicatePathwayNumbers.length > 0) {
      return res.status(400).json({ message: `Duplicate pathway numbers found in the request: ${duplicatePathwayNumbers.join(', ')}` });
    }

    // Check for existing pathway numbers in the database
    const existingStudents = await db.Student.findAll({ where: { pathway_number: pathwayNumbers } });
    if (existingStudents.length > 0) {
      const existingPathwayNumbers = existingStudents.map(s => s.pathway_number);
      return res.status(400).json({ message: `The following pathway numbers already exist in the database: ${existingPathwayNumbers.join(', ')}` });
    }

    const newStudents = await db.Student.bulkCreate(students, { transaction });
    await transaction.commit();
    res.status(201).json(newStudents);
  } catch (error) {
    await transaction.rollback();
    console.error('Error during bulk student creation:', error);
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

// Start the server
db.sequelize.sync({ alter: true }).then(() => {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
});