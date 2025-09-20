const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'first_name'
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'last_name'
  },
  pathwayNumber: {
    type: DataTypes.STRING,
    unique: true,
    field: 'pathway_number'
  },
  birthDate: {
    type: DataTypes.STRING,
    field: 'birth_date'
  },
  classOrder: {
    type: DataTypes.INTEGER,
    field: 'class_order'
  },
  gender: {
    type: DataTypes.STRING,
  },
  sectionId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'section_id'
  }
});

module.exports = Student;
