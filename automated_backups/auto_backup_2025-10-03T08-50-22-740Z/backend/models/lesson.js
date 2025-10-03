const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Lesson = sequelize.define('Lesson', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  templateId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  sectionId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  actualContent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  homework: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
});

module.exports = Lesson;
