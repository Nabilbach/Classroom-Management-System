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
    field: 'student_id',
  },
  sectionId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'section_id',
  },
  type: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'type',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'notes',
  },
  isOpen: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_open',
  }
}, {
  tableName: 'FollowUps',
  timestamps: true,
  underscored: true,
  freezeTableName: true,
});

module.exports = FollowUp;
