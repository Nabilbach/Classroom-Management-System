

const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const Section = require('./section')(sequelize, DataTypes);
const Student = require('./student')(sequelize, DataTypes);
const Attendance = require('./attendance')(sequelize, DataTypes);
const User = require('./user')(sequelize, DataTypes);

// Setup associations
Section.associate && Section.associate({ Student, Attendance });
Student.associate && Student.associate({ Section, Attendance });
Attendance.associate && Attendance.associate({ Student, Section });
User.associate && User.associate({ Section });

// علاقة المدرس بالصفوف (many-to-many)
User.belongsToMany(Section, {
  through: 'TeacherSections',
  foreignKey: 'teacherId',
  otherKey: 'sectionId'
});
Section.belongsToMany(User, {
  through: 'TeacherSections',
  foreignKey: 'sectionId',
  otherKey: 'teacherId'
});

module.exports = {
  sequelize,
  Section,
  Student,
  Attendance,
  User
};
