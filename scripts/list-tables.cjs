const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'classroom.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Failed to open DB:', err.message);
    process.exit(1);
  }
});

db.serialize(() => {
  db.all("SELECT name, type, sql FROM sqlite_master WHERE type='table' ORDER BY name", (err, rows) => {
    if (err) {
      console.error('Failed to list tables:', err.message);
      db.close();
      process.exit(1);
    }

    if (!rows || rows.length === 0) {
      console.log('No tables found in DB.');
      db.close();
      return;
    }

    console.log(`Found ${rows.length} tables:`);
    rows.forEach(r => {
      console.log('---');
      console.log(`name: ${r.name}`);
      console.log(`sql: ${r.sql ? r.sql.slice(0, 200) : '<no sql>'}`);
    });

    // For each table, show pragma table_info
    (async () => {
      for (const r of rows) {
        await new Promise((resolve) => {
          db.all(`PRAGMA table_info(${r.name})`, (err2, cols) => {
            if (err2) {
              console.log(`Cannot get columns for ${r.name}:`, err2.message);
            } else {
              console.log(`Columns for ${r.name}:`);
              cols.forEach(c => console.log(`  - ${c.name} (${c.type})${c.pk ? ' [PK]' : ''}`));
            }
            resolve();
          });
        });
      }
      db.close();
    })();
  });
});
