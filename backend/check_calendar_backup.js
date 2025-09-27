const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function checkCalendarLessonsInBackup() {
    console.log('🔍 فحص النسخة الاحتياطية للبحث عن جداول التقويم والدروس المنجزة...\n');

    const backupPath = path.join(__dirname, '..', 'classroom_before_restore_2025-09-26T14-53-53-289Z.db');

    try {
        const backupDb = new sqlite3.Database(backupPath);

        // فحص جميع الجداول في النسخة الاحتياطية
        const tables = await new Promise((resolve, reject) => {
            backupDb.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });

        console.log('📋 الجداول المتاحة في النسخة الاحتياطية:');
        tables.forEach((table, index) => {
            console.log(`   ${index + 1}. ${table.name}`);
        });

        // البحث عن جداول التقويم
        const calendarTables = tables.filter(table => 
            table.name.toLowerCase().includes('calendar') ||
            table.name.toLowerCase().includes('event') ||
            table.name.toLowerCase().includes('schedule')
        );

        if (calendarTables.length > 0) {
            console.log('\n📅 جداول التقويم الموجودة:');
            for (const table of calendarTables) {
                console.log(`\n🔍 فحص جدول: ${table.name}`);
                
                // فحص بنية الجدول
                const schema = await new Promise((resolve, reject) => {
                    backupDb.all(`PRAGMA table_info(${table.name})`, (err, rows) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(rows);
                    });
                });

                console.log('   الأعمدة:');
                schema.forEach(column => {
                    console.log(`     - ${column.name} (${column.type})`);
                });

                // فحص البيانات
                const data = await new Promise((resolve, reject) => {
                    backupDb.get(`SELECT COUNT(*) as count FROM ${table.name}`, (err, row) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(row.count);
                    });
                });
                
                console.log(`   عدد السجلات: ${data}`);

                if (data > 0) {
                    const sample = await new Promise((resolve, reject) => {
                        backupDb.all(`SELECT * FROM ${table.name} LIMIT 3`, (err, rows) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            resolve(rows);
                        });
                    });

                    console.log('   عينة من البيانات:');
                    sample.forEach((row, index) => {
                        console.log(`     ${index + 1}. ${JSON.stringify(row, null, 2)}`);
                    });
                }
            }
        }

        // فحص إذا كان هناك جدول ScheduledLessons
        const scheduledLessonsTable = tables.find(table => 
            table.name.toLowerCase().includes('scheduledlessons') ||
            table.name === 'ScheduledLessons'
        );

        if (scheduledLessonsTable) {
            console.log(`\n📚 فحص جدول الدروس المجدولة: ${scheduledLessonsTable.name}`);
            
            const count = await new Promise((resolve, reject) => {
                backupDb.get(`SELECT COUNT(*) as count FROM ${scheduledLessonsTable.name}`, (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(row.count);
                });
            });

            console.log(`   عدد الدروس المجدولة: ${count}`);

            if (count > 0) {
                const sample = await new Promise((resolve, reject) => {
                    backupDb.all(`SELECT * FROM ${scheduledLessonsTable.name} LIMIT 3`, (err, rows) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(rows);
                    });
                });

                console.log('   عينة من الدروس المجدولة:');
                sample.forEach((row, index) => {
                    console.log(`     ${index + 1}. ${JSON.stringify(row, null, 2)}`);
                });
            }
        }

        backupDb.close();

    } catch (error) {
        console.error('❌ خطأ في فحص النسخة الاحتياطية:', error);
    }
}

checkCalendarLessonsInBackup();