const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  pathway_number: {
    type: DataTypes.STRING,
    unique: true,
  },
  birth_date: {
    type: DataTypes.STRING,
  },
  class_order: {
    type: DataTypes.INTEGER,
  },
  gender: {
    type: DataTypes.STRING,
  },
});

module.exports = Student;
