const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LessonLog = sequelize.define('LessonLog', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  lessonId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  sectionId: {
    type: DataTypes.STRING,
    allowNull: true,
  }
});

module.exports = LessonLog;
