
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
        
        // نسخة احتياطية كل 6 ساعات
        setInterval(() => {
            const backup = new SmartBackupSystem();
            backup.createBackup();
        }, 6 * 60 * 60 * 1000);
        
        // نسخة احتياطية فورية عند بدء التشغيل
        const initialBackup = new SmartBackupSystem();
        initialBackup.createBackup();
        