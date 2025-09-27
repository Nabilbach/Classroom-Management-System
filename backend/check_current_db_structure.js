const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function checkLessonsTableStructureInDB() {
    console.log('🔍 فحص بنية جدول Lessons في قاعدة البيانات الحالية...\n');

    const currentDbPath = path.join(__dirname, '..', 'classroom.db');

    try {
        const currentDb = new sqlite3.Database(currentDbPath);

        // فحص بنية الجدول
        const tableInfo = await new Promise((resolve, reject) => {
            currentDb.all("PRAGMA table_info(Lessons)", (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });

        console.log('📋 بنية جدول Lessons الفعلية:');
        tableInfo.forEach((column, index) => {
            console.log(`   ${index + 1}. ${column.name} (${column.type}) - ${column.notnull ? 'NOT NULL' : 'NULL'} - ${column.pk ? 'PRIMARY KEY' : ''}`);
        });

        // جلب البيانات مباشرة من قاعدة البيانات
        const lessons = await new Promise((resolve, reject) => {
            currentDb.all("SELECT * FROM Lessons LIMIT 3", (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });

        console.log(`\n📊 عدد الدروس: ${lessons.length}`);
        if (lessons.length > 0) {
            console.log('\n📋 عينة من البيانات:');
            lessons.forEach((lesson, index) => {
                console.log(`\n   درس ${index + 1}:`);
                Object.keys(lesson).forEach(key => {
                    console.log(`     ${key}: ${lesson[key]}`);
                });
            });
        }

        currentDb.close();

    } catch (error) {
        console.error('❌ خطأ في فحص قاعدة البيانات:', error);
    }
}

checkLessonsTableStructureInDB();