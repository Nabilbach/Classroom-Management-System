const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const ROOT = path.resolve(__dirname, '..');
const DATES = ['2025-09-25', '2025-09-26'];

function listDbFiles() {
  const all = fs.readdirSync(ROOT);
  return all.filter(n => n.endsWith('.db') || n.endsWith('.db.db'))
            .map(n => path.join(ROOT, n))
            .sort();
}

function openDb(p) {
  return new sqlite3.Database(p, sqlite3.OPEN_READONLY);
}

function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
  });
}

async function scanFile(file) {
  const db = openDb(file);
  try {
    const tables = await all(db, "SELECT name FROM sqlite_master WHERE type='table'");
    const hasPlural = tables.some(t => t.name === 'Attendances');
    const hasSingular = tables.some(t => t.name === 'Attendance');
    const result = { file: path.basename(file), plural: {}, singular: {} };

    if (hasPlural) {
      const total = await all(db, 'SELECT COUNT(*) as c FROM Attendances');
      result.plural.total = total[0].c;
      for (const d of DATES) {
        const r = await all(db, 'SELECT COUNT(*) as c FROM Attendances WHERE date = ?', [d]);
        result.plural[d] = r[0].c;
      }
    }
    if (hasSingular) {
      const total = await all(db, 'SELECT COUNT(*) as c FROM Attendance');
      result.singular.total = total[0].c;
      // status -> present/absent; date exists as text
      for (const d of DATES) {
        const r = await all(db, 'SELECT COUNT(*) as c FROM Attendance WHERE date = ?', [d]);
        result.singular[d] = r[0].c;
      }
    }
    db.close();
    return result;
  } catch (e) {
    db.close();
    return { file: path.basename(file), error: e.message };
  }
}

(async () => {
  const files = listDbFiles();
  const rows = [];
  for (const f of files) {
    // Skip obvious temp/test if needed
    const info = await scanFile(f);
    rows.push(info);
  }
  console.log(`Scanning for dates: ${DATES.join(', ')}`);
  rows.forEach(r => {
    if (r.error) {
      console.log(`- ${r.file}: ERROR ${r.error}`);
    } else {
      const p = r.plural, s = r.singular;
      const part = (obj) => obj && Object.keys(obj).length ? `total=${obj.total}, 25=${obj['2025-09-25'] ?? '-'}, 26=${obj['2025-09-26'] ?? '-'}` : 'n/a';
      console.log(`- ${r.file}: Attendances(${part(p)}), Attendance(${part(s)})`);
    }
  });
})();
