const { Sequelize } = require('sequelize');
const path = require('path');

// Allow overriding the database file path via environment variable (DB_PATH).
// Default to the workspace-level `classroom.db` to keep a single source of truth.
const defaultDbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', 'classroom.db');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: defaultDbPath,
  logging: false,
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
});

module.exports = sequelize;
