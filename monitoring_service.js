
        // نظام المراقبة الدوري - يتم تشغيله كل ساعة
        const sqlite3 = require('sqlite3').verbose();
        
        class DataIntegrityMonitor {
            async checkSystemHealth() {
                const db = new sqlite3.Database('classroom.db');
                
                // فحص التطابق
                const issues = [];
                
                // فحص فقدان البيانات الحديثة
                db.all(`
                    SELECT COUNT(*) as recent_deletions 
                    FROM audit_log 
                    WHERE action_type = 'DELETE' 
                    AND timestamp >= datetime('now', '-1 hour')
                `, (err, result) => {
                    if (!err && result[0].recent_deletions > 0) {
                        console.warn('⚠️ تم حذف', result[0].recent_deletions, 'سجل في الساعة الماضية');
                    }
                });
                
                db.close();
            }
        }
        
        // تشغيل الفحص
        setInterval(async () => {
            const monitor = new DataIntegrityMonitor();
            await monitor.checkSystemHealth();
        }, 60 * 60 * 1000); // كل ساعة
        