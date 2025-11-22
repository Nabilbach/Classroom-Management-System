const fs = require('fs');
const path = require('path');

const cwd = path.resolve(__dirname, '..');
const src = path.join(cwd, 'classroom.db');
const backupsDir = path.join(cwd, 'backups');
if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
const ts = new Date().toISOString().replace(/[:.]/g, '-');
const dst = path.join(backupsDir, `classroom.db.bak-${ts}.sqlite`);

try {
  fs.copyFileSync(src, dst);
  console.log('Backup created:', dst);
} catch (e) {
  console.error('Backup failed:', e.message);
  process.exit(1);
}
