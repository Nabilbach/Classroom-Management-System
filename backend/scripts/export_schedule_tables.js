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
  ['classroom.db', 'classroom_backup_safe.db', 'classroom_before_restore_2025-09-26T14-53-53-289Z.db', 'classroom_backup_20250924_174347.db'].forEach(n => {
    const p = path.join(repoRoot, n);
    if (fs.existsSync(p)) found.add(p);
  });
  return Array.from(found).sort();
}

async function exportFromDb(dbPath, outDir) {
  const sequelize = new Sequelize({ dialect: 'sqlite', storage: dbPath, logging: false });
  try {
    const qi = sequelize.getQueryInterface();
    const tables = await qi.showAllTables();
    const normalized = tables.map(t => (typeof t === 'object' && t.name) ? t.name : String(t));
    const out = { db: dbPath, admin: [], scheduled: [] };

    if (normalized.find(n => n.toLowerCase() === 'adminscheduleentries' || n.toLowerCase() === 'admin_schedule_entries')) {
      try {
        const [rows] = await sequelize.query('SELECT * FROM AdminScheduleEntries ORDER BY datetime(createdAt) DESC');
        out.admin = rows;
      } catch (e) { out.adminError = String(e.message || e); }
    }
    if (normalized.find(n => n.toLowerCase() === 'scheduledlessons' || n.toLowerCase() === 'scheduled_lessons')) {
      try {
        const [rows2] = await sequelize.query('SELECT * FROM ScheduledLessons ORDER BY date DESC');
        out.scheduled = rows2;
      } catch (e) { out.scheduledError = String(e.message || e); }
    }

    const base = path.basename(dbPath).replace(/[:.]/g, '_');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, `${base}.schedule.json`);
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
    return outPath;
  } catch (e) {
    return { error: String(e.message || e) };
  } finally {
    try { await sequelize.close(); } catch (e) {}
  }
}

(async () => {
  const dbFiles = findDbFiles();
  console.log('Found DB files to export:', dbFiles.length);
  const outDir = path.join(repoRoot, 'backend', 'tmp_schedule_exports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const exported = [];
  for (const f of dbFiles) {
    console.log('Exporting from', f);
    const r = await exportFromDb(f, outDir);
    console.log(' ->', r);
    exported.push({ db: f, out: r });
  }
  console.log('\nExport complete. Files written to', outDir);
})();
