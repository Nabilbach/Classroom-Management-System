const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function dropAndRestoreLessons() {
    console.log('🔄 حذف وإعادة إنشاء جداول الدروس مع استعادة البيانات...\n');

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

        // حذف الجداول الحالية
        await new Promise((resolve) => {
            currentDb.run("DROP TABLE IF EXISTS Lessons", () => {
                console.log('🗑️ تم حذف جدول Lessons الحالي');
                resolve();
            });
        });

        await new Promise((resolve) => {
            currentDb.run("DROP TABLE IF EXISTS LessonLogs", () => {
                console.log('🗑️ تم حذف جدول LessonLogs الحالي');
                resolve();
            });
        });

        // إنشاء جدول Lessons جديد بالبنية الصحيحة
        await new Promise((resolve, reject) => {
            currentDb.run(`
                CREATE TABLE Lessons (
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
                console.log('✅ تم إنشاء جدول Lessons جديد بالبنية الصحيحة');
                resolve();
            });
        });

        // إنشاء جدول LessonLogs جديد
        await new Promise((resolve, reject) => {
            currentDb.run(`
                CREATE TABLE LessonLogs (
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
                console.log('✅ تم إنشاء جدول LessonLogs جديد بالبنية الصحيحة');
                resolve();
            });
        });

        // استعادة الدروس
        let lessonsInserted = 0;
        for (const lesson of lessonsData) {
            await new Promise((resolve, reject) => {
                currentDb.run(`
                    INSERT INTO Lessons 
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

        console.log(`\n🎉 تم استعادة الدروس بنجاح!`);
        console.log(`📚 إجمالي الدروس المستعادة: ${finalLessonsCount}`);

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
                console.log(`   ${index + 1}. ${lesson.id} - القسم: ${lesson.sectionId} - التاريخ: ${lesson.date}`);
                console.log(`       المحتوى: ${lesson.actualContent ? lesson.actualContent.substring(0, 80) + '...' : 'غير محدد'}`);
                console.log(`       الواجب: ${lesson.homework ? lesson.homework.substring(0, 50) + '...' : 'غير محدد'}`);
            });
        }

        // إغلاق قواعد البيانات
        backupDb.close();
        currentDb.close();

        console.log('\n✅ تم الانتهاء من استعادة الدروس');

    } catch (error) {
        console.error('❌ خطأ في استعادة الدروس:', error);
        process.exit(1);
    }
}

dropAndRestoreLessons();