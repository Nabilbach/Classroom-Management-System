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
  // Add other fields as necessary based on your lessonLogs.json structure
});

module.exports = LessonLog;
