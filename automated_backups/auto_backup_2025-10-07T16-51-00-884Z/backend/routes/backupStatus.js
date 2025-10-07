const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Get backup status
router.get('/', async (req, res) => {
  try {
    const autoBackupsDir = path.join(__dirname, '..', '..', 'auto_backups');
    const prestartBackupsDir = path.join(__dirname, '..', '..', 'backups', 'prestart');
    
    // Check if backup directories exist
    const autoBackupsExist = fs.existsSync(autoBackupsDir);
    const prestartBackupsExist = fs.existsSync(prestartBackupsDir);
    
    // Get backup files
    let allBackups = [];
    
    if (autoBackupsExist) {
      const autoFiles = fs.readdirSync(autoBackupsDir)
        .filter(f => f.endsWith('.db'))
        .map(f => ({
          path: path.join(autoBackupsDir, f),
          name: f,
          type: 'auto'
        }));
      allBackups.push(...autoFiles);
    }
    
    if (prestartBackupsExist) {
      const prestartFiles = fs.readdirSync(prestartBackupsDir)
        .filter(f => f.endsWith('.db'))
        .map(f => ({
          path: path.join(prestartBackupsDir, f),
          name: f,
          type: 'prestart'
        }));
      allBackups.push(...prestartFiles);
    }
    
    // Get stats for all backups
    const backupsWithStats = allBackups.map(backup => {
      try {
        const stats = fs.statSync(backup.path);
        return {
          ...backup,
          mtime: stats.mtime,
          size: stats.size
        };
      } catch (err) {
        return null;
      }
    }).filter(Boolean);
    
    // Sort by modification time
    backupsWithStats.sort((a, b) => b.mtime - a.mtime);
    
    // Get the most recent backup
    const lastBackup = backupsWithStats[0];
    
    // Check if service is running (backup created within last 7 hours)
    const sevenHoursAgo = new Date(Date.now() - 7 * 60 * 60 * 1000);
    const isRunning = lastBackup && lastBackup.mtime > sevenHoursAgo;
    
    // Calculate next backup time (every 6 hours from last backup)
    let nextBackup = null;
    if (isRunning && lastBackup) {
      nextBackup = new Date(lastBackup.mtime.getTime() + 6 * 60 * 60 * 1000);
    }
    
    res.json({
      isRunning,
      lastBackup: lastBackup ? lastBackup.mtime.toISOString() : null,
      nextBackup: nextBackup ? nextBackup.toISOString() : null,
      backupCount: backupsWithStats.length,
      recentBackups: backupsWithStats.slice(0, 5).map(b => ({
        name: b.name,
        type: b.type,
        date: b.mtime,
        size: b.size
      }))
    });
    
  } catch (error) {
    console.error('Error checking backup status:', error);
    res.status(500).json({
      isRunning: false,
      lastBackup: null,
      nextBackup: null,
      backupCount: 0,
      error: error.message
    });
  }
});

module.exports = router;
