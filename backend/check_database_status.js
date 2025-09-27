const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'classroom.db');

function checkDatabaseStatus() {
    const db = new sqlite3.Database(dbPath);
    
    console.log('📊 تقرير شامل عن حالة قاعدة البيانات\n');
    console.log('=' * 50);
    
    // التحقق من جميع الجداول المهمة
    const queries = [
        { name: 'الطلاب', query: 'SELECT COUNT(*) as count FROM Students', details: 'SELECT name, class FROM Students LIMIT 3' },
        { name: 'الأقسام', query: 'SELECT COUNT(*) as count FROM Sections', details: 'SELECT name, level FROM Sections LIMIT 3' },
        { name: 'الجدول الإداري', query: 'SELECT COUNT(*) as count FROM AdminSchedule', details: 'SELECT dayName, startTime, endTime FROM AdminSchedule LIMIT 3' },
        { name: 'الدروس المكتملة', query: 'SELECT COUNT(*) as count FROM Lessons', details: 'SELECT date, startTime, endTime, status FROM Lessons LIMIT 3' },
        { name: 'الدروس المجدولة (التقويم)', query: 'SELECT COUNT(*) as count FROM ScheduledLessons', details: 'SELECT title, scheduledDate, status FROM ScheduledLessons LIMIT 3' }
    ];
    
    let completedChecks = 0;
    
    queries.forEach((check, index) => {
        db.get(check.query, (err, countResult) => {
            if (err) {
                console.log(`❌ ${check.name}: خطأ - ${err.message}\n`);
            } else {
                console.log(`✅ ${check.name}: ${countResult.count} عنصر`);
                
                // إظهار عينة من البيانات
                db.all(check.details, (err, sampleData) => {
                    if (!err && sampleData.length > 0) {
                        console.log(`   عينة من البيانات:`);
                        sampleData.forEach((row, i) => {
                            console.log(`   ${i + 1}. ${JSON.stringify(row)}`);
                        });
                    }
                    console.log('');
                    
                    completedChecks++;
                    if (completedChecks === queries.length) {
                        console.log('🏁 انتهى فحص قاعدة البيانات');
                        db.close();
                    }
                });
            }
        });
    });
}

checkDatabaseStatus();