const fs = require('fs');
const path = require('path');

(async function main(){
  try {
    const backupsDir = path.join(__dirname, '..', '..', 'backups', 'prestart');
    if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
    const src = path.join(__dirname, '..', '..', 'classroom.db');
    if (!fs.existsSync(src)) {
      console.error('No active classroom.db found at', src);
      process.exit(1);
    }
    const name = `classroom_prestart_${new Date().toISOString().replace(/[:.]/g,'-')}.db`;
    const dest = path.join(backupsDir, name);
    fs.copyFileSync(src, dest);
    console.log('Snapshot created:', dest);
    process.exit(0);
  } catch (e) {
    console.error('prestart backup failed:', e);
    process.exit(1);
  }
})();
