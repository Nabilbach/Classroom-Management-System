const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'classroom.db');

async function checkDatabaseStatus() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.log('❌ خطأ في الاتصال بقاعدة البيانات:', err.message);
                reject(err);
                return;
            }
            
            console.log('📊 تقرير شامل عن حالة قاعدة البيانات\n');
            console.log('='.repeat(50));
            
            // التحقق من جميع الجداول المهمة
            const checks = [
                { name: 'الطلاب', table: 'Students' },
                { name: 'الأقسام', table: 'Sections' },
                { name: 'الجدول الإداري', table: 'AdminSchedule' },
                { name: 'الدروس المكتملة', table: 'Lessons' },
                { name: 'الدروس المجدولة (التقويم)', table: 'ScheduledLessons' }
            ];
            
            let completedChecks = 0;
            
            checks.forEach((check) => {
                db.get(`SELECT COUNT(*) as count FROM ${check.table}`, (err, result) => {
                    if (err) {
                        console.log(`❌ ${check.name}: خطأ - ${err.message}`);
                    } else {
                        console.log(`✅ ${check.name}: ${result.count} عنصر`);
                    }
                    
                    completedChecks++;
                    if (completedChecks === checks.length) {
                        console.log('\n🏁 انتهى فحص قاعدة البيانات');
                        db.close();
                        resolve();
                    }
                });
            });
        });
    });
}

checkDatabaseStatus().catch(console.error);