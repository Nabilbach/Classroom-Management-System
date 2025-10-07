const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', 'attendance-system', 'attendance.db');

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('OPEN ERROR', err.message);
    process.exit(1);
  }
});

db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (e, rows) => {
  if (e) {
    console.error('ERROR', e.message);
    db.close();
    process.exit(1);
  }
  console.log('TABLES:', JSON.stringify(rows, null, 2));

  db.all('SELECT id,username,role,fullName FROM Users', (err, u) => {
    if (err) console.log('USERS: (error or none)', err.message);
    else console.log('USERS:', JSON.stringify(u, null, 2));

    db.all('SELECT id,name,educationalLevel FROM Sections', (er, s) => {
      if (er) console.log('SECTIONS: (error or none)', er.message);
      else console.log('SECTIONS:', JSON.stringify(s, null, 2));
      db.close();
    });
  });
});
