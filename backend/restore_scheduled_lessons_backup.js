const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function restoreScheduledLessonsFromBackup() {
    console.log('🔄 استعادة الدروس المجدولة (المنجزة) من النسخة الاحتياطية...\n');

    const backupPath = path.join(__dirname, '..', 'classroom_before_restore_2025-09-26T14-53-53-289Z.db');
    const currentDbPath = path.join(__dirname, '..', 'classroom.db');

    try {
        // فتح النسخة الاحتياطية
        const backupDb = new sqlite3.Database(backupPath);
        console.log('✅ تم فتح النسخة الاحتياطية');

        // فتح قاعدة البيانات الحالية
        const currentDb = new sqlite3.Database(currentDbPath);
        console.log('✅ تم فتح قاعدة البيانات الحالية');

        // جلب بيانات الدروس المجدولة من النسخة الاحتياطية
        const scheduledLessonsData = await new Promise((resolve, reject) => {
            backupDb.all("SELECT * FROM ScheduledLessons", (err, rows) => {
                if (err) {
                    console.log(`❌ خطأ في جلب الدروس المجدولة: ${err.message}`);
                    resolve([]);
                    return;
                }
                resolve(rows);
            });
        });

        console.log(`📚 تم جلب ${scheduledLessonsData.length} درس مجدول من النسخة الاحتياطية`);

        // حذف الجدول الحالي وإنشاؤه من جديد
        await new Promise((resolve) => {
            currentDb.run("DROP TABLE IF EXISTS ScheduledLessons", () => {
                console.log('🗑️ تم حذف جدول ScheduledLessons الحالي');
                resolve();
            });
        });

        // إنشاء جدول ScheduledLessons جديد بالبنية الصحيحة
        await new Promise((resolve, reject) => {
            currentDb.run(`
                CREATE TABLE ScheduledLessons (
                    id VARCHAR(255) PRIMARY KEY,
                    date DATE,
                    startTime VARCHAR(255),
                    assignedSections JSON,
                    completionStatus JSON,
                    customTitle VARCHAR(255),
                    customDescription TEXT,
                    subject VARCHAR(255),
                    stages JSON,
                    estimatedSessions INTEGER,
                    manualSessionNumber INTEGER,
                    templateId VARCHAR(255),
                    lessonGroupId VARCHAR(255),
                    classroom VARCHAR(255),
                    notes TEXT,
                    progress INTEGER,
                    createdAt DATETIME,
                    updatedAt DATETIME
                )
            `, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                console.log('✅ تم إنشاء جدول ScheduledLessons جديد بالبنية الصحيحة');
                resolve();
            });
        });

        // استعادة الدروس المجدولة
        let lessonsInserted = 0;
        for (const lesson of scheduledLessonsData) {
            await new Promise((resolve, reject) => {
                currentDb.run(`
                    INSERT INTO ScheduledLessons 
                    (id, date, startTime, assignedSections, completionStatus, customTitle, 
                     customDescription, subject, stages, estimatedSessions, manualSessionNumber, 
                     templateId, lessonGroupId, classroom, notes, progress, createdAt, updatedAt)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    lesson.id,
                    lesson.date,
                    lesson.startTime,
                    lesson.assignedSections,
                    lesson.completionStatus,
                    lesson.customTitle,
                    lesson.customDescription,
                    lesson.subject,
                    lesson.stages,
                    lesson.estimatedSessions,
                    lesson.manualSessionNumber,
                    lesson.templateId,
                    lesson.lessonGroupId,
                    lesson.classroom,
                    lesson.notes,
                    lesson.progress,
                    lesson.createdAt,
                    lesson.updatedAt
                ], (err) => {
                    if (err) {
                        console.log(`❌ خطأ في إدراج درس: ${err.message}`);
                        reject(err);
                        return;
                    }
                    lessonsInserted++;
                    console.log(`✅ تم إدراج درس ${lessonsInserted}/${scheduledLessonsData.length}: ${lesson.customTitle} - ${lesson.date}`);
                    resolve();
                });
            });
        }

        // التحقق من النتائج النهائية
        const finalCount = await new Promise((resolve, reject) => {
            currentDb.get("SELECT COUNT(*) as count FROM ScheduledLessons", (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row.count);
            });
        });

        console.log(`\n🎉 تم استعادة الدروس المجدولة بنجاح!`);
        console.log(`📚 إجمالي الدروس المستعادة: ${finalCount}`);

        // عرض عينة من الدروس المستعادة
        if (finalCount > 0) {
            const sampleLessons = await new Promise((resolve, reject) => {
                currentDb.all("SELECT * FROM ScheduledLessons ORDER BY date, startTime LIMIT 5", (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(rows);
                });
            });

            console.log(`\n📋 عينة من الدروس المستعادة:`);
            sampleLessons.forEach((lesson, index) => {
                console.log(`   ${index + 1}. ${lesson.customTitle} - ${lesson.date} - ${lesson.startTime}`);
                console.log(`       الأقسام: ${lesson.assignedSections}`);
                console.log(`       الحالة: ${lesson.completionStatus}`);
                console.log('');
            });
        }

        // إغلاق قواعد البيانات
        backupDb.close();
        currentDb.close();

        console.log('\n✅ تم الانتهاء من استعادة الدروس المجدولة');

    } catch (error) {
        console.error('❌ خطأ في استعادة الدروس المجدولة:', error);
        process.exit(1);
    }
}

restoreScheduledLessonsFromBackup();