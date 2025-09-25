const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LessonTemplate = sequelize.define('LessonTemplate', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  estimatedSessions: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  stages: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  courseName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  level: {
    type: DataTypes.STRING,
    allowNull: true
  },
  weekNumber: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  scheduledSections: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  }
}, {
  timestamps: true
});

module.exports = LessonTemplate;
