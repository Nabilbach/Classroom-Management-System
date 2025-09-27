const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function restoreLessonsWithCorrectStructure() {
    console.log('🔄 استعادة الدروس وسجلات الحصص بالبنية الصحيحة...\n');

    const backupPath = path.join(__dirname, '..', 'classroom_before_restore_2025-09-26T14-53-53-289Z.db');
    const currentDbPath = path.join(__dirname, '..', 'classroom.db');

    try {
        // فتح النسخة الاحتياطية
        const backupDb = new sqlite3.Database(backupPath);
        console.log('✅ تم فتح النسخة الاحتياطية');

        // فتح قاعدة البيانات الحالية
        const currentDb = new sqlite3.Database(currentDbPath);
        console.log('✅ تم فتح قاعدة البيانات الحالية');

        // جلب بيانات الدروس من النسخة الاحتياطية
        const lessonsData = await new Promise((resolve, reject) => {
            backupDb.all("SELECT * FROM Lessons", (err, rows) => {
                if (err) {
                    console.log(`❌ خطأ في جلب الدروس: ${err.message}`);
                    resolve([]);
                    return;
                }
                resolve(rows);
            });
        });

        console.log(`📚 تم جلب ${lessonsData.length} درس من النسخة الاحتياطية`);

        // جلب بيانات سجلات الحصص من النسخة الاحتياطية
        const logsData = await new Promise((resolve, reject) => {
            backupDb.all("SELECT * FROM LessonLogs", (err, rows) => {
                if (err) {
                    console.log(`❌ خطأ في جلب سجلات الحصص: ${err.message}`);
                    resolve([]);
                    return;
                }
                resolve(rows);
            });
        });

        console.log(`📝 تم جلب ${logsData.length} سجل حصة من النسخة الاحتياطية`);

        // إنشاء جدول Lessons بالبنية الصحيحة
        await new Promise((resolve, reject) => {
            currentDb.run(`
                CREATE TABLE IF NOT EXISTS Lessons (
                    id TEXT PRIMARY KEY,
                    templateId TEXT,
                    sectionId TEXT NOT NULL,
                    date DATE NOT NULL,
                    startTime TIME,
                    endTime TIME,
                    status TEXT,
                    actualContent TEXT,
                    homework TEXT,
                    notes TEXT,
                    createdAt DATETIME,
                    updatedAt DATETIME
                )
            `, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                console.log('✅ تم التأكد من وجود جدول Lessons بالبنية الصحيحة');
                resolve();
            });
        });

        // إنشاء جدول LessonLogs بالبنية الصحيحة
        await new Promise((resolve, reject) => {
            currentDb.run(`
                CREATE TABLE IF NOT EXISTS LessonLogs (
                    id VARCHAR(255) PRIMARY KEY,
                    date DATETIME NOT NULL,
                    createdAt DATETIME NOT NULL,
                    updatedAt DATETIME NOT NULL,
                    lessonId VARCHAR(255),
                    sectionId VARCHAR(255)
                )
            `, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                console.log('✅ تم التأكد من وجود جدول LessonLogs بالبنية الصحيحة');
                resolve();
            });
        });

        // حذف البيانات الحالية إن وجدت
        await new Promise((resolve) => {
            currentDb.run("DELETE FROM Lessons", () => resolve());
        });

        await new Promise((resolve) => {
            currentDb.run("DELETE FROM LessonLogs", () => resolve());
        });

        // استعادة الدروس
        let lessonsInserted = 0;
        for (const lesson of lessonsData) {
            await new Promise((resolve, reject) => {
                currentDb.run(`
                    INSERT OR REPLACE INTO Lessons 
                    (id, templateId, sectionId, date, startTime, endTime, status, actualContent, homework, notes, createdAt, updatedAt)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    lesson.id,
                    lesson.templateId,
                    lesson.sectionId,
                    lesson.date,
                    lesson.startTime,
                    lesson.endTime,
                    lesson.status,
                    lesson.actualContent,
                    lesson.homework,
                    lesson.notes,
                    lesson.createdAt,
                    lesson.updatedAt
                ], (err) => {
                    if (err) {
                        console.log(`❌ خطأ في إدراج درس: ${err.message}`);
                        reject(err);
                        return;
                    }
                    lessonsInserted++;
                    console.log(`✅ تم إدراج درس ${lessonsInserted}/${lessonsData.length}: ${lesson.id} - القسم: ${lesson.sectionId} - التاريخ: ${lesson.date}`);
                    resolve();
                });
            });
        }

        // استعادة سجلات الحصص
        let logsInserted = 0;
        for (const log of logsData) {
            await new Promise((resolve, reject) => {
                currentDb.run(`
                    INSERT OR REPLACE INTO LessonLogs 
                    (id, date, createdAt, updatedAt, lessonId, sectionId)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    log.id,
                    log.date,
                    log.createdAt,
                    log.updatedAt,
                    log.lessonId,
                    log.sectionId
                ], (err) => {
                    if (err) {
                        console.log(`❌ خطأ في إدراج سجل حصة: ${err.message}`);
                        reject(err);
                        return;
                    }
                    logsInserted++;
                    console.log(`✅ تم إدراج سجل حصة ${logsInserted}/${logsData.length}: ${log.id}`);
                    resolve();
                });
            });
        }

        // التحقق من النتائج النهائية
        const finalLessonsCount = await new Promise((resolve, reject) => {
            currentDb.get("SELECT COUNT(*) as count FROM Lessons", (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row.count);
            });
        });

        const finalLogsCount = await new Promise((resolve, reject) => {
            currentDb.get("SELECT COUNT(*) as count FROM LessonLogs", (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row.count);
            });
        });

        console.log(`\n🎉 تم استعادة الدروس وسجلات الحصص بنجاح!`);
        console.log(`📚 إجمالي الدروس المستعادة: ${finalLessonsCount}`);
        console.log(`📝 إجمالي سجلات الحصص المستعادة: ${finalLogsCount}`);

        // عرض عينة من الدروس المستعادة
        if (finalLessonsCount > 0) {
            const sampleLessons = await new Promise((resolve, reject) => {
                currentDb.all("SELECT * FROM Lessons LIMIT 5", (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(rows);
                });
            });

            console.log(`\n📋 عينة من الدروس المستعادة:`);
            sampleLessons.forEach((lesson, index) => {
                console.log(`   ${index + 1}. ${lesson.id} - القسم: ${lesson.sectionId} - التاريخ: ${lesson.date} - المحتوى: ${lesson.actualContent ? lesson.actualContent.substring(0, 50) + '...' : 'غير محدد'}`);
            });
        }

        // إغلاق قواعد البيانات
        backupDb.close();
        currentDb.close();

        console.log('\n✅ تم الانتهاء من استعادة الدروس وسجلات الحصص');

    } catch (error) {
        console.error('❌ خطأ في استعادة الدروس وسجلات الحصص:', error);
        process.exit(1);
    }
}

restoreLessonsWithCorrectStructure();