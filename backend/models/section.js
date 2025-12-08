const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Section = sequelize.define('Section', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  educationalLevel: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  specialization: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  curriculumId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Curriculums',
      key: 'id'
    }
  },
  lessonProgress: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  }
});

module.exports = Section;
