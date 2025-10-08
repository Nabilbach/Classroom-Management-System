const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AdministrativeTimetableEntry = sequelize.define('AdministrativeTimetableEntry', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
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
    defaultValue: 1,
  },
  sectionId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  classroom: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  teacherId: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
  tableName: 'administrative_timetable',
  timestamps: true
});

module.exports = AdministrativeTimetableEntry;
