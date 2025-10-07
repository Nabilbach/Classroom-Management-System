// Migration script to rename columns in Students table to match Sequelize model
// Usage: node fix_students_columns.cjs

const sqlite3 = require('sqlite3').verbose();
const dbPath = 'attendance-system/attendance.db'; // Change path if needed
const db = new sqlite3.Database(dbPath);

function runMigration() {
  db.serialize(() => {
    // Rename columns if they exist
    db.get("PRAGMA table_info(Students)", (err, row) => {
      if (err) {
        console.error('Error reading Students table info:', err);
        process.exit(1);
      }
    });
    // Rename first_name -> firstName
    db.run("ALTER TABLE Students RENAME COLUMN first_name TO firstName", err => {
      if (err) console.log('first_name column not found or already renamed:', err.message);
      else console.log('Renamed first_name to firstName');
    });
    // Rename last_name -> lastName
    db.run("ALTER TABLE Students RENAME COLUMN last_name TO lastName", err => {
      if (err) console.log('last_name column not found or already renamed:', err.message);
      else console.log('Renamed last_name to lastName');
    });
    // Rename section_id -> sectionId
    db.run("ALTER TABLE Students RENAME COLUMN section_id TO sectionId", err => {
      if (err) console.log('section_id column not found or already renamed:', err.message);
      else console.log('Renamed section_id to sectionId');
    });
    // Rename class_order -> classOrder
    db.run("ALTER TABLE Students RENAME COLUMN class_order TO classOrder", err => {
      if (err) console.log('class_order column not found or already renamed:', err.message);
      else console.log('Renamed class_order to classOrder');
    });
    db.close();
  });
}

runMigration();
