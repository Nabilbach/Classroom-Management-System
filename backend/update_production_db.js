const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Target the production database
const dbPath = path.join(__dirname, '..', 'classroom.db');
console.log(`Updating database at: ${dbPath}`);

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // 1. Create Curriculums table
  db.run(`CREATE TABLE IF NOT EXISTS Curriculums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    educationalLevel TEXT NOT NULL,
    description TEXT,
    isActive BOOLEAN DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('Error creating Curriculums table:', err.message);
    else console.log('Curriculums table checked/created.');
  });

  // 2. Create CurriculumItems table (just in case)
  db.run(`CREATE TABLE IF NOT EXISTS CurriculumItems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    curriculumId INTEGER NOT NULL,
    title TEXT NOT NULL,
    orderIndex INTEGER DEFAULT 0,
    duration INTEGER DEFAULT 1,
    type TEXT DEFAULT 'lesson',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(curriculumId) REFERENCES Curriculums(id) ON DELETE CASCADE
  )`, (err) => {
    if (err) console.error('Error creating CurriculumItems table:', err.message);
    else console.log('CurriculumItems table checked/created.');
  });

  // 3. Add specialization column to Sections
  db.run("ALTER TABLE Sections ADD COLUMN specialization TEXT", (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('Column specialization already exists in Sections.');
      } else {
        console.error('Error adding specialization column:', err.message);
      }
    } else {
      console.log('Column specialization added to Sections.');
    }
  });

  // 4. Add curriculumId column to Sections
  db.run("ALTER TABLE Sections ADD COLUMN curriculumId INTEGER REFERENCES Curriculums(id)", (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('Column curriculumId already exists in Sections.');
      } else {
        console.error('Error adding curriculumId column:', err.message);
      }
    } else {
      console.log('Column curriculumId added to Sections.');
    }
  });
});

db.close((err) => {
  if (err) console.error(err.message);
  console.log('Database update complete.');
});
