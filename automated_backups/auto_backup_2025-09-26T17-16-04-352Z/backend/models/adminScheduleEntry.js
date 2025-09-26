const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AdminScheduleEntry = sequelize.define('AdminScheduleEntry', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  day: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  startTime: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  sectionId: {
    type: DataTypes.STRING,
    allowNull: true, // Allow null in case a section is deleted or not yet assigned
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  teacher: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  classroom: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  sessionType: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true
});

module.exports = AdminScheduleEntry;
