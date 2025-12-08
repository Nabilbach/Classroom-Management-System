const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'classroom_dev.db');
const db = new sqlite3.Database(dbPath);

console.log(`Checking database: ${dbPath}`);

db.serialize(() => {
  // Check Section count
  db.get("SELECT count(*) as count FROM Sections", (err, row) => {
    if (err) console.error('Error counting sections:', err.message);
    else console.log(`Sections count: ${row.count}`);
  });

  // Check Curriculums table existence
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='Curriculums'", (err, row) => {
    if (err) console.error('Error checking Curriculums table:', err.message);
    else console.log(`Curriculums table exists: ${!!row}`);
  });

  // Check Sections columns
  db.all("PRAGMA table_info(Sections)", (err, rows) => {
    if (err) console.error('Error checking Sections columns:', err.message);
    else {
      const columns = rows.map(r => r.name);
      console.log('Sections columns:', columns.join(', '));
      console.log('Has specialization:', columns.includes('specialization'));
      console.log('Has curriculumId:', columns.includes('curriculumId'));
    }
  });
});

db.close();
