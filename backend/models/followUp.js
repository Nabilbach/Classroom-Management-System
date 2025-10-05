const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FollowUp = sequelize.define('FollowUp', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'student_id'
  },
  sectionId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'section_id'
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  is_open: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = FollowUp;
