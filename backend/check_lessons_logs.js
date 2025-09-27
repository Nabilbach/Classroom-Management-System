const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function checkLessonsAndLogs() {
    console.log('🔍 فحص سجلات الدروس والحصص في قاعدة البيانات...\n');

    const currentDbPath = path.join(__dirname, '..', 'classroom.db');
    const backupPath = path.join(__dirname, '..', 'classroom_before_restore_2025-09-26T14-53-53-289Z.db');

    try {
        // فحص قاعدة البيانات الحالية
        console.log('📊 فحص قاعدة البيانات الحالية:');
        const currentDb = new sqlite3.Database(currentDbPath);

        // فحص جدول Lessons
        const currentLessons = await new Promise((resolve, reject) => {
            currentDb.get("SELECT COUNT(*) as count FROM Lessons", (err, row) => {
                if (err) {
                    console.log(`❌ جدول Lessons غير موجود: ${err.message}`);
                    resolve(0);
                    return;
                }
                resolve(row.count);
            });
        });

        console.log(`📚 عدد الدروس في قاعدة البيانات الحالية: ${currentLessons}`);

        // فحص جدول LessonLogs
        const currentLogs = await new Promise((resolve, reject) => {
            currentDb.get("SELECT COUNT(*) as count FROM LessonLogs", (err, row) => {
                if (err) {
                    console.log(`❌ جدول LessonLogs غير موجود: ${err.message}`);
                    resolve(0);
                    return;
                }
                resolve(row.count);
            });
        });

        console.log(`📝 عدد سجلات الحصص في قاعدة البيانات الحالية: ${currentLogs}`);

        currentDb.close();

        // فحص النسخة الاحتياطية
        console.log('\n📂 فحص النسخة الاحتياطية:');
        const backupDb = new sqlite3.Database(backupPath);

        // فحص جدول Lessons في النسخة الاحتياطية
        const backupLessons = await new Promise((resolve, reject) => {
            backupDb.get("SELECT COUNT(*) as count FROM Lessons", (err, row) => {
                if (err) {
                    console.log(`❌ جدول Lessons غير موجود في النسخة الاحتياطية: ${err.message}`);
                    resolve(0);
                    return;
                }
                resolve(row.count);
            });
        });

        console.log(`📚 عدد الدروس في النسخة الاحتياطية: ${backupLessons}`);

        // فحص جدول LessonLogs في النسخة الاحتياطية
        const backupLogs = await new Promise((resolve, reject) => {
            backupDb.get("SELECT COUNT(*) as count FROM LessonLogs", (err, row) => {
                if (err) {
                    console.log(`❌ جدول LessonLogs غير موجود في النسخة الاحتياطية: ${err.message}`);
                    resolve(0);
                    return;
                }
                resolve(row.count);
            });
        });

        console.log(`📝 عدد سجلات الحصص في النسخة الاحتياطية: ${backupLogs}`);

        // عرض عينة من الدروس
        if (backupLessons > 0) {
            console.log('\n📋 عينة من الدروس في النسخة الاحتياطية:');
            const sampleLessons = await new Promise((resolve, reject) => {
                backupDb.all("SELECT * FROM Lessons LIMIT 5", (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(rows);
                });
            });

            sampleLessons.forEach((lesson, index) => {
                console.log(`   ${index + 1}. ID: ${lesson.id} - القسم: ${lesson.sectionId} - العنوان: ${lesson.title}`);
            });
        }

        // عرض عينة من سجلات الحصص
        if (backupLogs > 0) {
            console.log('\n📝 عينة من سجلات الحصص في النسخة الاحتياطية:');
            const sampleLogs = await new Promise((resolve, reject) => {
                backupDb.all("SELECT * FROM LessonLogs LIMIT 5", (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(rows);
                });
            });

            sampleLogs.forEach((log, index) => {
                console.log(`   ${index + 1}. ID: ${log.id} - القسم: ${log.sectionId} - التاريخ: ${log.date} - الموضوع: ${log.topic}`);
            });
        }

        backupDb.close();

        console.log('\n📊 ملخص المقارنة:');
        console.log(`📚 الدروس - الحالي: ${currentLessons} | النسخة الاحتياطية: ${backupLessons}`);
        console.log(`📝 سجلات الحصص - الحالي: ${currentLogs} | النسخة الاحتياطية: ${backupLogs}`);

        if (backupLessons > currentLessons || backupLogs > currentLogs) {
            console.log('\n🔄 يُنصح بالاستعادة من النسخة الاحتياطية');
        } else {
            console.log('\n✅ البيانات الحالية محدثة');
        }

    } catch (error) {
        console.error('❌ خطأ في فحص البيانات:', error);
    }
}

checkLessonsAndLogs();