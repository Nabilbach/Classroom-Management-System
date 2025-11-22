const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'classroom.db');
const outDir = path.join(__dirname, '..', 'reports');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const ts = new Date().toISOString().replace(/[:.]/g, '-');
const outPath = path.join(outDir, `student_assessments-${ts}.csv`);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Failed to open DB:', err.message);
    process.exit(1);
  }
});

const q = `SELECT id, studentId, date, old_score, new_score, score_change, total_xp, notes, createdAt, updatedAt FROM StudentAssessments ORDER BY date DESC, id DESC`;

db.serialize(() => {
  db.all(q, (err, rows) => {
    if (err) {
      console.error('Query failed:', err.message);
      db.close();
      process.exit(1);
    }

    const header = ['id','studentId','date','old_score','new_score','score_change','total_xp','notes','createdAt','updatedAt'];
    const lines = [header.join(',')];

    rows.forEach(r => {
      const vals = header.map(h => {
        const v = r[h] == null ? '' : String(r[h]).replace(/\r?\n/g, ' ').replace(/"/g, '""');
        // wrap in quotes if contains comma
        return (`"${v}"`);
      });
      lines.push(vals.join(','));
    });

    fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
    console.log('Exported', rows.length, 'rows to', outPath);
    db.close();
  });
});
