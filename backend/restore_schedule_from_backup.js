const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function restoreScheduleFromBackup() {
    console.log('🔄 استعادة الجدول الزمني من النسخة الاحتياطية...\n');

    const backupPath = path.join(__dirname, '..', 'classroom_before_restore_2025-09-26T14-53-53-289Z.db');
    const currentDbPath = path.join(__dirname, '..', 'classroom.db');

    try {
        // فتح النسخة الاحتياطية
        const backupDb = new sqlite3.Database(backupPath);
        console.log('✅ تم فتح النسخة الاحتياطية');

        // فتح قاعدة البيانات الحالية
        const currentDb = new sqlite3.Database(currentDbPath);
        console.log('✅ تم فتح قاعدة البيانات الحالية');

        // جلب بيانات الجدول الزمني من النسخة الاحتياطية
        const scheduleData = await new Promise((resolve, reject) => {
            backupDb.all("SELECT * FROM AdminScheduleEntries", (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });

        console.log(`📊 تم جلب ${scheduleData.length} حصة من النسخة الاحتياطية`);

        // حذف البيانات الحالية (إن وجدت)
        await new Promise((resolve, reject) => {
            currentDb.run("DELETE FROM AdminScheduleEntries", (err) => {
                if (err) {
                    console.log('⚠️ لم يتم العثور على جدول AdminScheduleEntries، سيتم إنشاؤه');
                }
                resolve();
            });
        });

        // إنشاء الجدول إذا لم يكن موجوداً
        await new Promise((resolve, reject) => {
            currentDb.run(`
                CREATE TABLE IF NOT EXISTS AdminScheduleEntries (
                    id TEXT PRIMARY KEY,
                    day TEXT NOT NULL,
                    startTime TEXT NOT NULL,
                    duration INTEGER NOT NULL,
                    sectionId TEXT,
                    subject TEXT,
                    teacher TEXT,
                    classroom TEXT,
                    sessionType TEXT,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                console.log('✅ تم التأكد من وجود جدول AdminScheduleEntries');
                resolve();
            });
        });

        // إدراج البيانات المستعادة
        let insertedCount = 0;
        for (const entry of scheduleData) {
            await new Promise((resolve, reject) => {
                currentDb.run(`
                    INSERT OR REPLACE INTO AdminScheduleEntries 
                    (id, day, startTime, duration, sectionId, subject, teacher, classroom, sessionType, createdAt, updatedAt)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    entry.id,
                    entry.day,
                    entry.startTime,
                    entry.duration,
                    entry.sectionId,
                    entry.subject,
                    entry.teacher,
                    entry.classroom,
                    entry.sessionType,
                    entry.createdAt,
                    entry.updatedAt
                ], (err) => {
                    if (err) {
                        console.log(`❌ خطأ في إدراج حصة: ${err.message}`);
                        reject(err);
                        return;
                    }
                    insertedCount++;
                    console.log(`✅ تم إدراج حصة ${insertedCount}/${scheduleData.length}: ${entry.day} - ${entry.startTime} - القسم: ${entry.sectionId}`);
                    resolve();
                });
            });
        }

        // التحقق من النتيجة
        const finalCount = await new Promise((resolve, reject) => {
            currentDb.get("SELECT COUNT(*) as count FROM AdminScheduleEntries", (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row.count);
            });
        });

        console.log(`\n🎉 تم استعادة الجدول الزمني بنجاح!`);
        console.log(`📊 إجمالي الحصص المستعادة: ${finalCount}`);

        // عرض عينة من البيانات المستعادة
        const sampleData = await new Promise((resolve, reject) => {
            currentDb.all("SELECT * FROM AdminScheduleEntries ORDER BY day, startTime LIMIT 5", (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });

        console.log(`\n📋 عينة من البيانات المستعادة:`);
        sampleData.forEach((row, index) => {
            console.log(`   ${index + 1}. ${row.day} - ${row.startTime} - القسم: ${row.sectionId} - المادة: ${row.subject || 'غير محدد'}`);
        });

        // إغلاق قواعد البيانات
        backupDb.close();
        currentDb.close();

        console.log('\n✅ تم الانتهاء من استعادة الجدول الزمني');

    } catch (error) {
        console.error('❌ خطأ في استعادة الجدول الزمني:', error);
        process.exit(1);
    }
}

restoreScheduleFromBackup();