const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node inspect-db.js <path-to-db>');
  process.exit(1);
}

const resolvedPath = path.resolve(filePath);
console.log(`Inspecting database: ${resolvedPath}`);

const db = new sqlite3.Database(resolvedPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Failed to open database:', err.message);
    process.exit(1);
  }
});

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

(async () => {
  try {
    const tables = await query("SELECT name, sql FROM sqlite_master WHERE type='table'");
    console.log('Tables:', tables.map(t => t.name).join(', ') || '(none)');
    const pluralTable = tables.find(t => t.name === 'Attendances');
    const singularTable = tables.find(t => t.name === 'Attendance');

    let targetTable = null;
    let pluralCount, singularCount;
    if (pluralTable) {
      pluralCount = await query('SELECT COUNT(*) as count FROM Attendances');
      console.log(`Attendances table count: ${pluralCount[0].count}`);
      if (pluralCount[0].count > 0) targetTable = 'Attendances';
    }
    if (singularTable) {
      singularCount = await query('SELECT COUNT(*) as count FROM Attendance');
      console.log(`Attendance table count: ${singularCount[0].count}`);
      if (!targetTable || singularCount[0].count > pluralCount?.[0]?.count) {
        if (singularCount[0].count > 0) targetTable = 'Attendance';
      }
    }

    if (!targetTable) {
      targetTable = pluralTable ? 'Attendances' : singularTable ? 'Attendance' : null;
    }

    if (!targetTable) {
      console.log('⚠️  No attendance table found in this database.');
      db.close();
      process.exit(0);
    }

    // Detect schema (columns)
    const columns = await query(`PRAGMA table_info(${targetTable})`);
    const colNames = columns.map(c => c.name);
    const hasIsPresent = colNames.includes('isPresent');
    const hasStatus = colNames.includes('status');
    const hasPresent = colNames.includes('present');
    console.log(`Schema for ${targetTable}:`, colNames.join(', '));

    const total = await query(`SELECT COUNT(*) as count FROM ${targetTable}`);
    console.log(`Total attendance records: ${total[0].count}`);

    const distinctDates = await query(`SELECT DISTINCT date FROM ${targetTable} ORDER BY date ASC`);
    console.log('Dates:', distinctDates.map(r => r.date || '(null)').join(', '));

    // Counts for specific critical dates
    const datesToCheck = ['2025-09-25', '2025-09-26'];
    for (const d of datesToCheck) {
      const countOnD = await query(`SELECT COUNT(*) as count FROM ${targetTable} WHERE date = ?`, [d]);
      console.log(`Count on ${d}: ${countOnD[0].count}`);
    }

    const targetTableDef = tables.find(t => t.name === targetTable);
    const updatedAtColumn = targetTableDef && targetTableDef.sql && targetTableDef.sql.includes('"updatedAt"');
    const orderClause = updatedAtColumn ? 'ORDER BY date DESC, updatedAt DESC' : 'ORDER BY date DESC, id DESC';
    // Select present flag robustly
    const presentExpr = hasIsPresent ? 'isPresent as presentVal' : hasStatus ? "CASE status WHEN 'present' THEN 1 ELSE 0 END as presentVal" : hasPresent ? 'present as presentVal' : 'NULL as presentVal';
    const latest = await query(`SELECT id, studentId, sectionId, date, ${presentExpr} FROM ${targetTable} ${orderClause} LIMIT 10`);
    console.log('Latest 10 records:');
    latest.forEach(row => {
      console.log(`- id=${row.id} studentId=${row.studentId} section=${row.sectionId} date=${row.date} present=${row.presentVal}`);
    });
  } catch (err) {
    console.error('Error inspecting database:', err.message);
  } finally {
    db.close();
  }
})();
