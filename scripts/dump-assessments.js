const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'classroom.db');

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Failed to open DB:', err.message);
    process.exit(1);
  }
});

const q = `SELECT id, studentId, date, old_score, new_score, score_change, total_xp, notes, createdAt, updatedAt FROM StudentAssessment ORDER BY date DESC, id DESC`;

db.serialize(() => {
  db.all(q, (err, rows) => {
    if (err) {
      console.error('Query failed:', err.message);
      db.close();
      process.exit(1);
    }

    if (!rows || rows.length === 0) {
      console.log('No StudentAssessment records found.');
    } else {
      console.log(`Found ${rows.length} StudentAssessment records:\n`);
      rows.forEach(r => {
        console.log('---');
        console.log(`id: ${r.id}`);
        console.log(`studentId: ${r.studentId}`);
        console.log(`date: ${r.date}`);
        console.log(`old_score: ${r.old_score}`);
        console.log(`new_score: ${r.new_score}`);
        console.log(`score_change: ${r.score_change}`);
        console.log(`total_xp: ${r.total_xp}`);
        console.log(`notes: ${r.notes}`);
        console.log(`createdAt: ${r.createdAt}`);
        console.log(`updatedAt: ${r.updatedAt}`);
      });
    }

    db.close();
  });
});
