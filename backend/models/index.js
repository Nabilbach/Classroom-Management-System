const sequelize = require('../config/database');
const Section = require('./section');
const Lesson = require('./lesson');
const LessonTemplate = require('./lessonTemplate');
const LessonLog = require('./lessonLog');
const Student = require('./student');
const StudentAssessment = require('./studentAssessment');
const ScheduledLesson = require('./scheduledLesson');
const AdministrativeTimetableEntry = require('./administrativeTimetableEntry');
const AdminScheduleEntry = require('./adminScheduleEntry');
const Attendance = require('./attendance');
const TextbookEntry = require('./textbookEntry');
const FollowUp = require('./followUp');

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

// FollowUp associations
Student.hasMany(FollowUp, { foreignKey: 'studentId' });
FollowUp.belongsTo(Student, { foreignKey: 'studentId' });

// Attendance associations
Student.hasMany(Attendance, { foreignKey: 'studentId' });
Attendance.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

Section.hasMany(Attendance, { foreignKey: 'sectionId' });
Attendance.belongsTo(Section, { foreignKey: 'sectionId' });

const db = {
  sequelize,
  Sequelize: sequelize.Sequelize,
  Section,
  Lesson,
  LessonTemplate,
  LessonLog,
  Student,
  StudentAssessment,
  ScheduledLesson,
  AdministrativeTimetableEntry,
  AdminScheduleEntry,
  Attendance,
  TextbookEntry,
  FollowUp,
};

module.exports = db;