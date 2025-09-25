const sqlite3 = require('sqlite3').verbose();

class DataIntegrityMonitor {
    constructor() {
        this.dbPath = 'classroom.db';
    }

    async checkSystemHealth() {
        return new Promise((resolve) => {
            const db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READONLY);
            
            console.log('🔍 فحص سلامة النظام...');
            
            // فحص العمليات الحديثة المشبوهة
            db.all(`
                SELECT 
                    action_type,
                    table_name,
                    COUNT(*) as count,
                    datetime(max(timestamp), 'localtime') as latest_time
                FROM audit_log 
                WHERE timestamp >= datetime('now', '-1 hour')
                GROUP BY action_type, table_name
                ORDER BY latest_time DESC
            `, (err, recentActivity) => {
                
                if (!err && recentActivity && recentActivity.length > 0) {
                    console.log('📋 النشاط في الساعة الماضية:');
                    recentActivity.forEach(activity => {
                        let emoji = '📝';
                        if (activity.action_type === 'DELETE') emoji = '🗑️';
                        if (activity.action_type === 'CRITICAL_UPDATE') emoji = '⚠️';
                        
                        console.log(`   ${emoji} ${activity.table_name}: ${activity.count} × ${activity.action_type}`);
                    });
                    
                    // تحذير من عمليات الحذف المتكررة
                    const deletions = recentActivity.filter(a => a.action_type === 'DELETE');
                    if (deletions.length > 0) {
                        const totalDeletions = deletions.reduce((sum, d) => sum + d.count, 0);
                        if (totalDeletions > 5) {
                            console.warn(`🚨 تحذير: ${totalDeletions} عملية حذف في الساعة الماضية!`);
                        }
                    }
                } else {
                    console.log('✅ لا يوجد نشاط مشبوه في الساعة الماضية');
                }
                
                // فحص التطابق السريع
                this.quickIntegrityCheck(db, () => {
                    db.close();
                    resolve();
                });
            });
        });
    }

    quickIntegrityCheck(db, callback) {
        console.log('🔍 فحص التطابق السريع...');
        
        // فحص عدد السجلات في الجداول المهمة
        const queries = [
            { name: 'TextbookEntries', query: 'SELECT COUNT(*) as count FROM TextbookEntries' },
            { name: 'Students', query: 'SELECT COUNT(*) as count FROM Students' },
            { name: 'Sections', query: 'SELECT COUNT(*) as count FROM Sections' }
        ];
        
        let completed = 0;
        const results = {};
        
        queries.forEach(({name, query}) => {
            db.get(query, (err, result) => {
                completed++;
                
                if (!err && result) {
                    results[name] = result.count;
                    console.log(`   📊 ${name}: ${result.count} سجل`);
                } else {
                    console.error(`   ❌ خطأ في فحص ${name}`);
                }
                
                if (completed === queries.length) {
                    // حفظ الأرقام لمقارنة لاحقة
                    const timestamp = new Date().toISOString();
                    const healthReport = {
                        timestamp,
                        counts: results,
                        status: 'healthy'
                    };
                    
                    // تسجيل في ملف المراقبة
                    const fs = require('fs');
                    try {
                        const logEntry = `${timestamp}: ${JSON.stringify(results)}\n`;
                        fs.appendFileSync('system_health.log', logEntry);
                    } catch (error) {
                        console.error('⚠️ خطأ في كتابة لوج المراقبة:', error.message);
                    }
                    
                    callback();
                }
            });
        });
    }
}

// بدء خدمة المراقبة
console.log('🚀 بدء خدمة مراقبة سلامة البيانات...');

const monitor = new DataIntegrityMonitor();

// فحص فوري عند البدء
monitor.checkSystemHealth().then(() => {
    console.log('✅ الفحص الأولي مكتمل');
});

// فحص دوري كل ساعة
setInterval(async () => {
    console.log('\n⏰ بدء الفحص الدوري...');
    try {
        await monitor.checkSystemHealth();
        console.log('✅ الفحص الدوري مكتمل\n');
    } catch (error) {
        console.error('❌ خطأ في الفحص الدوري:', error.message);
    }
}, 60 * 60 * 1000); // كل ساعة

console.log('📊 خدمة المراقبة تعمل - فحص كل ساعة');
console.log('📋 سجل المراقبة: system_health.log');
console.log('🔄 للإيقاف اضغط Ctrl+C');

// إبقاء العملية نشطة
process.on('SIGINT', () => {
    console.log('\n🛑 إيقاف خدمة المراقبة...');
    process.exit(0);
});