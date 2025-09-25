const fs = require('fs');
const path = require('path');

class SmartBackupSystem {
    createBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `auto_backup_${timestamp}.db`;
        
        try {
            if (!fs.existsSync('auto_backups')) {
                fs.mkdirSync('auto_backups');
            }
            
            fs.copyFileSync('classroom.db', path.join('auto_backups', backupName));
            console.log('✅ نسخة احتياطية تلقائية:', backupName);
            
            // حذف النسخ القديمة (الاحتفاظ بـ 10 نسخ فقط)
            this.cleanOldBackups();
        } catch (error) {
            console.error('❌ خطأ في النسخة الاحتياطية:', error.message);
        }
    }
    
    cleanOldBackups() {
        try {
            const backupDir = 'auto_backups';
            if (!fs.existsSync(backupDir)) return;
            
            const files = fs.readdirSync(backupDir)
                .filter(file => file.startsWith('auto_backup_'))
                .map(file => ({
                    name: file,
                    time: fs.statSync(path.join(backupDir, file)).mtime
                }))
                .sort((a, b) => b.time - a.time);
            
            // حذف النسخ الزائدة
            files.slice(10).forEach(file => {
                fs.unlinkSync(path.join(backupDir, file.name));
                console.log('🗑️ حذف نسخة قديمة:', file.name);
            });
        } catch (error) {
            console.error('⚠️ خطأ في تنظيف النسخ القديمة:', error.message);
        }
    }
}

// نسخة احتياطية فورية عند بدء التشغيل
console.log('🚀 بدء خدمة النسخ الاحتياطية الذكية...');
const initialBackup = new SmartBackupSystem();
initialBackup.createBackup();

// نسخة احتياطية كل 6 ساعات
setInterval(() => {
    console.log('⏰ وقت النسخة الاحتياطية الدورية...');
    const backup = new SmartBackupSystem();
    backup.createBackup();
}, 6 * 60 * 60 * 1000);

console.log('📊 خدمة النسخ الاحتياطية تعمل - نسخة كل 6 ساعات');
console.log('💾 مجلد النسخ: auto_backups/');
console.log('🔄 للإيقاف اضغط Ctrl+C');

// إبقاء العملية نشطة
process.on('SIGINT', () => {
    console.log('\n🛑 إيقاف خدمة النسخ الاحتياطية...');
    process.exit(0);
});