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
  // Persist detailed scores (sliders, quran, bonus) as JSON
  scores: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  // Optional: store computed XP and level for snapshotting
  total_xp: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  student_level: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

module.exports = StudentAssessment;
