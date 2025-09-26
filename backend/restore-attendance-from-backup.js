const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

function openDb(p, mode) {
  return new sqlite3.Database(p, mode);
}

function all(db, sql, params = []) {
  return new Promise((resolve, reject) => db.all(sql, params, (e, rows) => e ? reject(e) : resolve(rows)));
}
function get(db, sql, params = []) {
  return new Promise((resolve, reject) => db.get(sql, params, (e, row) => e ? reject(e) : resolve(row)));
}
function run(db, sql, params = []) {
  return new Promise((resolve, reject) => db.run(sql, params, function (e) { e ? reject(e) : resolve(this); }));
}

async function detectAttendanceTable(db) {
  const tables = await all(db, "SELECT name FROM sqlite_master WHERE type='table'");
  const hasPlural = tables.some(t => t.name === 'Attendances');
  const hasSingular = tables.some(t => t.name === 'Attendance');
  if (hasPlural) return 'Attendances';
  if (hasSingular) return 'Attendance';
  return null;
}

async function getColumns(db, table) {
  const rows = await all(db, `PRAGMA table_info(${table})`);
  return rows.map(r => r.name);
}

async function backupFile(filePath) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath, '.db');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const out = path.join(dir, `${base}_backup_before_restore_${stamp}.db`);
  await fs.promises.copyFile(filePath, out);
  return out;
}

async function main() {
  const SRC = process.argv[2];
  const APPLY = process.argv.includes('--apply');
  const DATES = process.argv.find(a => a.startsWith('--dates='))?.split('=')[1]?.split(',') || ['2025-09-25','2025-09-26'];

  if (!SRC) {
    console.error('Usage: node restore-attendance-from-backup.js <source.db> [--dates=YYYY-MM-DD,YYYY-MM-DD] [--apply]');
    process.exit(1);
  }

  const ROOT = path.resolve(__dirname, '..');
  const DEST = path.join(ROOT, 'classroom.db');

  console.log('Source:', path.resolve(SRC));
  console.log('Destination:', DEST);
  console.log('Dates:', DATES.join(', '));
  console.log('Mode:', APPLY ? 'APPLY (will write changes)' : 'DRY-RUN (no changes)');

  const srcDb = openDb(path.resolve(SRC), sqlite3.OPEN_READONLY);
  const destDb = openDb(DEST, sqlite3.OPEN_READWRITE);

  try {
    const srcTable = await detectAttendanceTable(srcDb);
    const destTable = await detectAttendanceTable(destDb);
    if (!srcTable) throw new Error('No attendance table in source');
    if (!destTable) throw new Error('No attendance table in destination');

    const srcCols = await getColumns(srcDb, srcTable);
    const destCols = await getColumns(destDb, destTable);
    const hasSrcIsPresent = srcCols.includes('isPresent');
    const hasSrcStatus = srcCols.includes('status');
    const hasDestCreatedAt = destCols.includes('createdAt');
    const hasDestUpdatedAt = destCols.includes('updatedAt');

    // Read rows from source
    const placeholders = DATES.map(() => '?').join(',');
    const presentExpr = hasSrcIsPresent ? 'isPresent' : hasSrcStatus ? "CASE status WHEN 'present' THEN 1 ELSE 0 END" : 'NULL';
    const selectCreated = srcCols.includes('createdAt') ? 'createdAt' : `'` + new Date().toISOString() + `' AS createdAt`;
    const selectUpdated = srcCols.includes('updatedAt') ? 'updatedAt' : `'` + new Date().toISOString() + `' AS updatedAt`;
    const srcRows = await all(
      srcDb,
      `SELECT id, studentId, sectionId, date, ${presentExpr} AS isPresent, ${selectCreated}, ${selectUpdated}
       FROM ${srcTable} WHERE date IN (${placeholders})`,
      DATES
    );

    console.log(`\nFound ${srcRows.length} source rows for specified dates.`);

  // Build student and section existence cache in destination
  const destStudents = await all(destDb, 'SELECT id FROM Students');
  const destSections = await all(destDb, 'SELECT id FROM Sections');
  const studentSet = new Set(destStudents.map(s => s.id));
  const sectionSet = new Set(destSections.map(s => s.id));

    // Prepare validation and dedupe
    let candidates = [];
    for (const r of srcRows) {
  // Validate student and section existence
  if (!studentSet.has(r.studentId)) continue;
  if (!sectionSet.has(String(r.sectionId))) continue;
      // Check duplicate in destination by (studentId,date)
      const exists = await get(destDb, `SELECT id FROM ${destTable} WHERE studentId = ? AND date = ?`, [r.studentId, r.date]);
      if (exists) continue;
      candidates.push(r);
    }

    console.log(`Eligible candidates after validation (student exists, not duplicate): ${candidates.length}`);

    if (!APPLY) {
      // Show a small sample
      console.log('\nSample (up to 10):');
      candidates.slice(0, 10).forEach(c => {
        console.log(`- studentId=${c.studentId}, sectionId=${c.sectionId}, date=${c.date}, present=${c.isPresent}`);
      });
      console.log('\nDRY-RUN complete. Re-run with --apply to write changes.');
      return;
    }

    // Backup destination before changes
    const backupPath = await backupFile(DEST);
    console.log('Created safety backup:', backupPath);

    // Insert candidates
    await run(destDb, 'BEGIN');
    const now = new Date().toISOString();
    let inserted = 0;
    for (const c of candidates) {
      const createdAt = c.createdAt || now;
      const updatedAt = c.updatedAt || now;
      const cols = ['studentId', 'sectionId', 'date', 'isPresent']
        .concat(hasDestCreatedAt ? ['createdAt'] : [])
        .concat(hasDestUpdatedAt ? ['updatedAt'] : []);
      const placeholdersIns = cols.map(() => '?').join(',');
      const values = [c.studentId, String(c.sectionId), c.date, c.isPresent ? 1 : 0]
        .concat(hasDestCreatedAt ? [createdAt] : [])
        .concat(hasDestUpdatedAt ? [updatedAt] : []);
      await run(destDb, `INSERT INTO ${destTable} (${cols.join(',')}) VALUES (${placeholdersIns})`, values);
      inserted++;
    }
    await run(destDb, 'COMMIT');
    console.log(`\nInserted ${inserted} records into ${destTable}.`);

  } catch (e) {
    try { await run(destDb, 'ROLLBACK'); } catch {}
    console.error('Restore failed:', e.message);
    process.exitCode = 1;
  } finally {
    srcDb.close();
    destDb.close();
  }
}

main();
