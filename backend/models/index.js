const sequelize = require('../config/database');
const Section = require('./section');
const Lesson = require('./lesson');
const LessonLog = require('./lessonLog');
const Student = require('./student');
const StudentAssessment = require('./studentAssessment');

// Define associations
Section.hasMany(Lesson, { foreignKey: 'sectionId' });
Lesson.belongsTo(Section, { foreignKey: 'sectionId' });

Lesson.hasMany(LessonLog, { foreignKey: 'lessonId' });
LessonLog.belongsTo(Lesson, { foreignKey: 'lessonId' });

Section.hasMany(LessonLog, { foreignKey: 'sectionId' });
LessonLog.belongsTo(Section, { foreignKey: 'sectionId' });

Section.hasMany(Student, { foreignKey: 'sectionId' });
Student.belongsTo(Section, { foreignKey: 'sectionId' });

Student.hasMany(StudentAssessment, { foreignKey: 'studentId' });
StudentAssessment.belongsTo(Student, { foreignKey: 'studentId' });

const db = {
  sequelize,
  Sequelize: sequelize.Sequelize,
  Section,
  Lesson,
  LessonLog,
  Student,
  StudentAssessment,
};

module.exports = db;