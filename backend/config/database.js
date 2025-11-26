const { Sequelize } = require('sequelize');
const path = require('path');

// Use DB_PATH from environment, default to classroom.db (production)
const dbPath = process.env.DB_PATH || 'classroom.db';
const dbFilePath = path.join(__dirname, '..', '..', dbPath);

console.log(`📦 Database Configuration:`);
console.log(`   Environment: ${process.env.NODE_ENV || 'production'}`);
console.log(`   Database: ${dbPath}`);

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbFilePath,
  logging: false,
  dialectOptions: {
    charset: 'utf8mb4',
  },
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
});

module.exports = sequelize;

