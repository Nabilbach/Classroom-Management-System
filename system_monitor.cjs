const fs = require('fs');
const path = require('path');

console.log('🔍 Backup and System Health Monitor');
console.log('═'.repeat(40));

// Check database
if (fs.existsSync('./classroom.db')) {
    const stats = fs.statSync('./classroom.db');
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`✅ Database: ${sizeMB} MB`);
} else {
    console.log('❌ Database: Not found!');
}

// Check backups
const backupDir = './automated_backups';
if (fs.existsSync(backupDir)) {
    try {
        const items = fs.readdirSync(backupDir);
        const backups = items.filter(name => {
            const fullPath = path.join(backupDir, name);
            return fs.statSync(fullPath).isDirectory();
        });
        
        console.log(`✅ Backups: ${backups.length} found`);
        
        if (backups.length > 0) {
            const latestBackup = backups.sort().pop();
            const latestPath = path.join(backupDir, latestBackup);
            const created = fs.statSync(latestPath).birthtime;
            const hoursAgo = Math.round((Date.now() - created.getTime()) / (1000 * 60 * 60));
            console.log(`📅 Latest: ${latestBackup} (${hoursAgo}h ago)`);
        }
    } catch (error) {
        console.log(`⚠️ Backups: Error - ${error.message}`);
    }
} else {
    console.log('❌ Backups: Directory not found');
}

// Check backend models
try {
    const models = require('./backend/models');
    console.log('✅ Backend: Models accessible');
    
    // Try to get counts
    if (models.Student && models.Attendance && models.Section) {
        Promise.all([
            models.Student.count(),
            models.Attendance.count(),
            models.Section.count()
        ]).then(([students, records, sections]) => {
            console.log(`📊 Data: ${students} students, ${records} records, ${sections} sections`);
            console.log('✅ Health check completed');
        }).catch(err => {
            console.log(`⚠️ Database query failed: ${err.message}`);
            console.log('✅ Basic check completed');
        });
    } else {
        console.log('⚠️ Backend: Models incomplete');
        console.log('✅ Basic check completed');
    }
} catch (error) {
    console.log(`❌ Backend: ${error.message}`);
    console.log('✅ File system check completed');
}

// Log this check
const logEntry = {
    timestamp: new Date().toISOString(),
    type: 'HEALTH_CHECK',
    status: 'completed'
};

fs.appendFileSync('./system_health.log', JSON.stringify(logEntry) + '\n');