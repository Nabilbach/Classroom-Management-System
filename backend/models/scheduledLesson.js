const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ScheduledLesson = sequelize.define('ScheduledLesson', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  startTime: {
    type: DataTypes.STRING,
    allowNull: false, // Time is essential for a session
  },
  assignedSections: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  completionStatus: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {}
  },
  customTitle: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  customDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  stages: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  estimatedSessions: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  templateId: {
    type: DataTypes.STRING,
    allowNull: true, // Allow null if not linked to a template
    defaultValue: null,
  },
  lessonGroupId: {
    type: DataTypes.STRING,
    allowNull: true, // Allow null if not part of a group
  },
  classroom: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  timestamps: true
});

module.exports = ScheduledLesson;
