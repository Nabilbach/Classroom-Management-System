const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CurriculumItem = sequelize.define('CurriculumItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  unitTitle: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'The unit or chapter this item belongs to'
  },
  estimatedSessions: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  curriculumId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Curriculums',
      key: 'id'
    }
  },
  linkedTemplateId: {
    type: DataTypes.STRING, // Assuming template IDs are strings/UUIDs
    allowNull: true,
    comment: 'ID of the LessonTemplate associated with this curriculum item'
  }
}, {
  timestamps: true
});

module.exports = CurriculumItem;
