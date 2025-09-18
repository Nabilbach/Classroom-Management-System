const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Students', // Assumes the table name for Student model is 'Students'
      key: 'id',
    },
  },
  sectionId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'Sections', // Assumes the table name for Section model is 'Sections'
      key: 'id',
    },
  },
  isPresent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
}, {
  tableName: 'Attendance',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['studentId', 'date']
    }
  ]
});

module.exports = Attendance;
