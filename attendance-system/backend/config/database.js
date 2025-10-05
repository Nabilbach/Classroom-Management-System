const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'attendance.db'),
  logging: false,
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
});

module.exports = sequelize;
