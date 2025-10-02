const fs = require('fs');
const path = require('path');
const { Attendance } = require('./models');

/*
  Safer emergency restore tool.
  Usage:
    node emergency-restore.js --source ../path/to/backup.db --force
    or set env FORCE_RESTORE=1 and optionally SOURCE_BACKUP to skip prompt.

  Behavior:
  - Creates a timestamped snapshot of the current classroom.db under backups/automatic_snapshots/
  - If --source is provided uses that file; otherwise will pick the newest file matching classroom*_*.db
  - Requires explicit --force flag or env FORCE_RESTORE=1 to perform the copy; otherwise it prints what it would do.
  - Logs actions to backups/restore_audit.log
*/

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--force') out.force = true;
    else if (a === '--source' && args[i+1]) { out.source = args[i+1]; i++; }
  }
  return out;
}

function logAudit(msg) {
  const logDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  const auditFile = path.join(logDir, 'restore_audit.log');
  const line = `${new Date().toISOString()} - ${msg}\n`;
  fs.appendFileSync(auditFile, line);
}

async function emergencyRestore() {
  try {
    console.log('🚨 emergency-restore starting...');

    const { force, source } = parseArgs();
    const envForce = process.env.FORCE_RESTORE === '1' || process.env.FORCE_RESTORE === 'true';
    const chosenForce = force || envForce;

    // snapshot current DB
    const snapshotsDir = path.join(__dirname, '..', 'backups', 'automatic_snapshots');
    if (!fs.existsSync(snapshotsDir)) fs.mkdirSync(snapshotsDir, { recursive: true });
    const snapshotName = `classroom_snapshot_before_restore_${new Date().toISOString().replace(/[:.]/g,'-')}.db`;
    const srcActive = path.join(__dirname, '..', 'classroom.db');
    const snapshotPath = path.join(snapshotsDir, snapshotName);
    fs.copyFileSync(srcActive, snapshotPath);
    console.log(`✅ created snapshot: ${path.relative(process.cwd(), snapshotPath)}`);
    logAudit(`snapshot created: ${snapshotPath}`);

    // choose source backup
    let sourceBackup = source || process.env.SOURCE_BACKUP;
    if (!sourceBackup) {
      // auto-select newest backup matching pattern
      const root = path.join(__dirname, '..');
      const files = fs.readdirSync(root).filter(f => /classroom.*\.db$/i.test(f));
      files.sort((a,b) => fs.statSync(path.join(root,b)).mtimeMs - fs.statSync(path.join(root,a)).mtimeMs);
      if (files.length > 0) sourceBackup = path.join(root, files[0]);
    }

    if (!sourceBackup) {
      console.error('No source backup found. Provide one with --source or set SOURCE_BACKUP env var.');
      logAudit('restore aborted: no source backup');
      process.exit(1);
    }

    console.log(`Source backup selected: ${sourceBackup}`);
    logAudit(`source selected: ${sourceBackup}`);

    if (!chosenForce) {
      console.log('\nDry run: no changes were made. To proceed re-run with --force or set FORCE_RESTORE=1');
      process.exit(0);
    }

    // optional cleanup of generated attendance rows (kept as a separate, safe operation)
    try {
      console.log('Removing generated attendance rows...');
      const deletedCount = await Attendance.destroy({ where: {}, truncate: true });
      console.log(`✅ removed ${deletedCount} generated attendance rows`);
      logAudit(`attendance truncated: ${deletedCount}`);
    } catch (e) {
      console.warn('could not truncate Attendance table:', e.message);
      logAudit(`attendance truncate failed: ${e.message}`);
    }

    // perform restore
    const dest = path.join(__dirname, '..', 'classroom.db');
    fs.copyFileSync(sourceBackup, dest);
    console.log('✅ restore applied.');
    logAudit(`restore applied from ${sourceBackup} to ${dest}`);

    console.log('Please restart the server to apply changes.');
    process.exit(0);
  } catch (error) {
    console.error('restore failed:', error);
    logAudit(`restore failed: ${error && error.message}`);
    process.exit(1);
  }
}

emergencyRestore();