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
  }
});

module.exports = Section;
