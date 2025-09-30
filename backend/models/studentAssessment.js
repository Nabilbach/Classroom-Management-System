const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StudentAssessment = sequelize.define('StudentAssessment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  date: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  old_score: {
    type: DataTypes.DECIMAL,
    allowNull: false,
  },
  new_score: {
    type: DataTypes.DECIMAL,
    allowNull: false,
  },
  score_change: {
    type: DataTypes.DECIMAL,
    allowNull: false,
  },
  // Detailed per-criterion scores stored as JSON text for compatibility across DB engines
  scores: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  notes: {
    type: DataTypes.STRING,
  },
});

module.exports = StudentAssessment;
