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
  notes: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Persist detailed scores (sliders, quran, bonus) as JSON
  scores: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('scores');
      return rawValue ? JSON.parse(rawValue) : null;
    },
    set(value) {
      this.setDataValue('scores', value ? JSON.stringify(value) : null);
    }
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
  // ✅ إضافة الحقل الأجنبي - الإصلاح الرئيسي
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'studentId',  // العمود في قاعدة البيانات باسم studentId
    references: {
      model: 'Students',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  }
});

module.exports = StudentAssessment;
