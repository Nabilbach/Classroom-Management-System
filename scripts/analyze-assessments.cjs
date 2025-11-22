const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'classroom.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Failed to open DB:', err.message);
    process.exit(1);
  }
});

function runQuery(q) {
  return new Promise((res, rej) => db.all(q, (err, rows) => err ? rej(err) : res(rows)));
}

(async () => {
  try {
    console.log('1) Assessments with notes mentioning إعادة (possible resets):');
    const resets = await runQuery("SELECT id, studentId, date, old_score, new_score, score_change, notes, createdAt FROM StudentAssessments WHERE notes LIKE '%إعادة%' OR notes LIKE '%إعاده%' ORDER BY date DESC, id DESC");
    console.log(`Found ${resets.length} records (showing up to 50):`);
    resets.slice(0,50).forEach(r => console.log(`- id:${r.id} student:${r.studentId} date:${r.date} old:${r.old_score} new:${r.new_score} change:${r.score_change} notes:${r.notes}`));

    console.log('\n2) Assessments where score decreased (score_change < 0):');
    const decreases = await runQuery('SELECT id, studentId, date, old_score, new_score, score_change, notes, createdAt FROM StudentAssessments WHERE score_change < 0 ORDER BY date DESC, id DESC');
    console.log(`Found ${decreases.length} records:`);
    decreases.forEach(r => console.log(`- id:${r.id} student:${r.studentId} date:${r.date} old:${r.old_score} new:${r.new_score} change:${r.score_change} notes:${r.notes}`));

    console.log('\n3) Students with multiple assessments (top 50 by count):');
    const multiples = await runQuery('SELECT studentId, COUNT(*) as cnt, MIN(date) as firstDate, MAX(date) as lastDate FROM StudentAssessments GROUP BY studentId HAVING cnt > 1 ORDER BY cnt DESC, studentId LIMIT 50');
    console.log(`Found ${multiples.length} students with more than one assessment:`);
    multiples.forEach(m => console.log(`- student:${m.studentId} count:${m.cnt} range:${m.firstDate} -> ${m.lastDate}`));

    db.close();
  } catch (e) {
    console.error('Analysis failed:', e.message);
    db.close();
    process.exit(1);
  }
})();
