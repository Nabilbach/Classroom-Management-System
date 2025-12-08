const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'classroom_dev.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Add specialization column
  db.run("ALTER TABLE Sections ADD COLUMN specialization TEXT", (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('Column specialization already exists.');
      } else {
        console.error('Error adding specialization column:', err.message);
      }
    } else {
      console.log('Column specialization added successfully.');
    }
  });

  // Add curriculumId column
  db.run("ALTER TABLE Sections ADD COLUMN curriculumId INTEGER REFERENCES Curriculums(id)", (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('Column curriculumId already exists.');
      } else {
        console.error('Error adding curriculumId column:', err.message);
      }
    } else {
      console.log('Column curriculumId added successfully.');
    }
  });
});

db.close();