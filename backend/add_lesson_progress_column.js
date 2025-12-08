const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const databases = ['classroom_dev.db', 'classroom.db'];

databases.forEach(dbName => {
  const dbPath = path.join(__dirname, '..', dbName);
  const db = new sqlite3.Database(dbPath);

  console.log(`Updating ${dbName}...`);

  db.serialize(() => {
    db.run("ALTER TABLE Sections ADD COLUMN lessonProgress TEXT", (err) => {
      if (err) {
        if (err.message.includes('duplicate column name')) {
          console.log(`Column lessonProgress already exists in ${dbName}.`);
        } else {
          console.error(`Error adding lessonProgress column to ${dbName}:`, err.message);
        }
      } else {
        console.log(`Column lessonProgress added to ${dbName}.`);
      }
    });
  });

  db.close();
});
