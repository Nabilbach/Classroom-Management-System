const path = require('path');
const fs = require('fs');
const sequelize = require('./config/database');
const sqlite3 = require('sqlite3');

(async () => {
  try {
    // Print configured storage path if available
    const cfg = sequelize.options || {};
    console.log('Sequelize storage:', cfg.storage || '<unknown>');

    const dbPath = cfg.storage || path.join(__dirname, '..', '..', 'classroom.db');
    if (!fs.existsSync(dbPath)) {
      console.log('Database file does not exist at', dbPath);
      process.exit(0);
    }

    const db = new sqlite3.Database(dbPath);
    db.all("SELECT name, type, sql FROM sqlite_master WHERE type='table' ORDER BY name;", (err, rows) => {
      if (err) {
        console.error('Error reading sqlite_master:', err);
        process.exit(1);
      }
      console.log('Tables in DB:');
      rows.forEach(r => console.log('-', r.name));
      process.exit(0);
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
