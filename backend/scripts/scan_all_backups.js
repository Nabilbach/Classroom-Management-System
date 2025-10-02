const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

const repoRoot = path.resolve(__dirname, '..', '..');
const searchDirs = [
  repoRoot,
  path.join(repoRoot, 'backups'),
  path.join(repoRoot, 'auto_backups'),
  path.join(repoRoot, 'security_backups'),
  path.join(repoRoot, 'emergency_environment_backups'),
];

function findDbFiles() {
  const found = new Set();
  for (const dir of searchDirs) {
    try {
      if (!fs.existsSync(dir)) continue;
      const items = fs.readdirSync(dir);
      for (const it of items) {
        if (it.toLowerCase().endsWith('.db')) {
          found.add(path.join(dir, it));
        }
      }
    } catch (e) {
      // ignore
    }
  }
  // Also include some well-known names in root
  ['classroom.db', 'classroom_backup_safe.db', 'classroom_before_restore_2025-09-26T14-53-53-289Z.db', 'classroom_backup_20250924_174347.db'].forEach(n => {
    const p = path.join(repoRoot, n);
    if (fs.existsSync(p)) found.add(p);
  });
  return Array.from(found).sort();
}

async function inspectDb(dbPath) {
  const result = { path: dbPath, size: 0, mtime: null, adminCount: 0, adminLatest: null, scheduledCount: 0, scheduledLatest: null };
  try {
    const stats = fs.statSync(dbPath);
    result.size = stats.size;
    result.mtime = stats.mtime.toISOString();
  } catch {}

  const sequelize = new Sequelize({ dialect: 'sqlite', storage: dbPath, logging: false });
  try {
    const qi = sequelize.getQueryInterface();
    const tables = await qi.showAllTables();
    const normalized = tables.map(t => (typeof t === 'object' && t.name) ? t.name : String(t));
    const hasAdmin = normalized.find(n => n.toLowerCase() === 'adminscheduleentries' || n.toLowerCase() === 'admin_schedule_entries');
    const hasScheduled = normalized.find(n => n.toLowerCase() === 'scheduledlessons' || n.toLowerCase() === 'scheduled_lessons');

    if (hasAdmin) {
      try {
        const [rows] = await sequelize.query("SELECT COUNT(1) as c, MAX(datetime(createdAt)) as latest FROM AdminScheduleEntries");
        if (rows && rows[0]) {
          result.adminCount = Number(rows[0].c || 0);
          result.adminLatest = rows[0].latest || null;
        }
      } catch (e) {}
    }
    if (hasScheduled) {
      try {
        const [rows2] = await sequelize.query("SELECT COUNT(1) as c, MAX(date) as latest FROM ScheduledLessons");
        if (rows2 && rows2[0]) {
          result.scheduledCount = Number(rows2[0].c || 0);
          result.scheduledLatest = rows2[0].latest || null;
        }
      } catch (e) {}
    }
  } catch (e) {
    result.error = String(e.message || e);
  } finally {
    try { await sequelize.close(); } catch {}
  }
  return result;
}

(async () => {
  const dbFiles = findDbFiles();
  console.log('Scanning DB files:', dbFiles.length);
  for (const f of dbFiles) {
    console.log('\n===', f, '===');
    const info = await inspectDb(f);
    console.log('size:', info.size, 'mtime:', info.mtime);
    if (info.error) console.log('ERROR:', info.error);
    console.log('AdminScheduleEntries: count=', info.adminCount, 'latestCreatedAt=', info.adminLatest);
    console.log('ScheduledLessons: count=', info.scheduledCount, 'latestDate=', info.scheduledLatest);
  }
})();
