const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbFiles = [
  { name: 'production', file: path.join(__dirname, '..', 'classroom.db') },
  { name: 'development', file: path.join(__dirname, '..', 'classroom_dev.db') },
];

function inspect(dbFile) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbFile.file, sqlite3.OPEN_READONLY, (err) => {
      if (err) return reject(err);
    });

    db.serialize(() => {
      db.all("SELECT name, type, sql FROM sqlite_master WHERE type IN ('table','index')", (err, rows) => {
        if (err) return reject(err);
        const tables = rows.filter(r => r.type === 'table').map(r => ({ name: r.name, sql: r.sql }));
        const indexes = rows.filter(r => r.type === 'index').map(r => ({ name: r.name, sql: r.sql }));

        const counts = {};
        let pending = tables.length;
        if (pending === 0) {
          db.close();
          return resolve({ db: dbFile.name, path: dbFile.file, tables: [], indexes: [], counts: {} });
        }

        tables.forEach(t => {
          db.get(`SELECT COUNT(*) as cnt FROM ${t.name}`, (err, row) => {
            counts[t.name] = err ? null : row.cnt;
            pending -= 1;
            if (pending === 0) {
              db.close();
              resolve({ db: dbFile.name, path: dbFile.file, tables, indexes, counts });
            }
          });
        });
      });
    });
  });
}

(async () => {
  try {
    const results = [];
    for (const dbFile of dbFiles) {
      try {
        const r = await inspect(dbFile);
        results.push(r);
      } catch (e) {
        results.push({ db: dbFile.name, path: dbFile.file, error: e.message });
      }
    }
    console.log(JSON.stringify(results, null, 2));
  } catch (e) {
    console.error('Fatal:', e);
  }
})();
