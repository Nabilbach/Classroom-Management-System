const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const devDbPath = path.join(__dirname, '..', 'classroom_dev.db');
const prodDbPath = path.join(__dirname, '..', 'classroom.db');

const devDb = new sqlite3.Database(devDbPath);
const prodDb = new sqlite3.Database(prodDbPath);

console.log('Migrating Curriculums from Dev to Prod...');

devDb.all("SELECT * FROM Curriculums", [], (err, rows) => {
  if (err) {
    console.error('Error reading from dev DB:', err);
    return;
  }

  if (rows.length === 0) {
    console.log('No curriculums to migrate.');
    return;
  }

  console.log(`Found ${rows.length} curriculums.`);

  prodDb.serialize(() => {
    const stmt = prodDb.prepare("INSERT OR REPLACE INTO Curriculums (id, title, subject, educationalLevel, description, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    
    rows.forEach(row => {
      stmt.run(row.id, row.title, row.subject, row.educationalLevel, row.description, row.isActive, row.createdAt, row.updatedAt, (err) => {
        if (err) console.error(`Error inserting curriculum ${row.id}:`, err.message);
        else console.log(`Migrated curriculum: ${row.title}`);
      });
    });

    stmt.finalize();
  });
});

// Also migrate CurriculumItems if any
devDb.all("SELECT * FROM CurriculumItems", [], (err, rows) => {
    if (err) {
      console.error('Error reading items from dev DB:', err);
      return;
    }
  
    if (rows.length === 0) {
      console.log('No curriculum items to migrate.');
      return;
    }
  
    console.log(`Found ${rows.length} curriculum items.`);
  
    prodDb.serialize(() => {
      const stmt = prodDb.prepare("INSERT OR REPLACE INTO CurriculumItems (id, curriculumId, title, orderIndex, duration, type, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
      
      rows.forEach(row => {
        stmt.run(row.id, row.curriculumId, row.title, row.orderIndex, row.duration, row.type, row.createdAt, row.updatedAt, (err) => {
          if (err) console.error(`Error inserting item ${row.id}:`, err.message);
        });
      });
  
      stmt.finalize(() => {
          console.log('Finished migrating items.');
          devDb.close();
          prodDb.close();
      });
    });
  });
