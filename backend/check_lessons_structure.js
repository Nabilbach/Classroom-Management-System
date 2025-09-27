const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function checkLessonsTableStructure() {
    console.log('🔍 فحص بنية جدول Lessons في النسخة الاحتياطية...\n');

    const backupPath = path.join(__dirname, '..', 'classroom_before_restore_2025-09-26T14-53-53-289Z.db');

    try {
        const backupDb = new sqlite3.Database(backupPath);

        // فحص بنية جدول Lessons
        const lessonsSchema = await new Promise((resolve, reject) => {
            backupDb.all("PRAGMA table_info(Lessons)", (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });

        console.log('📋 بنية جدول Lessons في النسخة الاحتياطية:');
        lessonsSchema.forEach((column, index) => {
            console.log(`   ${index + 1}. ${column.name} (${column.type}) - ${column.notnull ? 'NOT NULL' : 'NULL'} - ${column.pk ? 'PRIMARY KEY' : ''}`);
        });

        // عرض عينة من البيانات الفعلية
        const sampleData = await new Promise((resolve, reject) => {
            backupDb.all("SELECT * FROM Lessons LIMIT 3", (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });

        console.log('\n📊 عينة من البيانات الفعلية:');
        sampleData.forEach((row, index) => {
            console.log(`\n   درس ${index + 1}:`);
            Object.keys(row).forEach(key => {
                console.log(`     ${key}: ${row[key]}`);
            });
        });

        // فحص بنية جدول LessonLogs أيضاً
        const logsSchema = await new Promise((resolve, reject) => {
            backupDb.all("PRAGMA table_info(LessonLogs)", (err, rows) => {
                if (err) {
                    console.log('❌ جدول LessonLogs غير موجود');
                    resolve([]);
                    return;
                }
                resolve(rows);
            });
        });

        if (logsSchema.length > 0) {
            console.log('\n📋 بنية جدول LessonLogs في النسخة الاحتياطية:');
            logsSchema.forEach((column, index) => {
                console.log(`   ${index + 1}. ${column.name} (${column.type}) - ${column.notnull ? 'NOT NULL' : 'NULL'} - ${column.pk ? 'PRIMARY KEY' : ''}`);
            });
        }

        backupDb.close();

    } catch (error) {
        console.error('❌ خطأ في فحص بنية الجدول:', error);
    }
}

checkLessonsTableStructure();