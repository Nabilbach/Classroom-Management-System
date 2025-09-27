const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function checkScheduleInBackups() {
    console.log('🔍 فحص النسخ الاحتياطية للبحث عن بيانات الجدول الزمني...\n');

    const backupFiles = [
        'classroom_backup.db',
        'classroom_backup_2.db',
        'classroom_before_restore_2025-09-26T14-53-53-289Z.db'
    ];

    for (const backupFile of backupFiles) {
        const backupPath = path.join(__dirname, '..', backupFile);
        console.log(`\n📂 فحص الملف: ${backupFile}`);
        
        try {
            const db = new sqlite3.Database(backupPath);
            
            // فحص وجود جدول AdminScheduleEntries
            await new Promise((resolve, reject) => {
                db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='AdminScheduleEntries'", (err, row) => {
                    if (err) {
                        console.log(`❌ خطأ في قراءة الجدول: ${err.message}`);
                        reject(err);
                        return;
                    }
                    
                    if (row) {
                        console.log(`✅ جدول AdminScheduleEntries موجود`);
                        
                        // عد السجلات
                        db.get("SELECT COUNT(*) as count FROM AdminScheduleEntries", (err, countRow) => {
                            if (err) {
                                console.log(`❌ خطأ في عد السجلات: ${err.message}`);
                                reject(err);
                                return;
                            }
                            
                            console.log(`📊 عدد حصص الجدول الزمني: ${countRow.count}`);
                            
                            if (countRow.count > 0) {
                                // عرض عينة من البيانات
                                db.all("SELECT * FROM AdminScheduleEntries LIMIT 5", (err, rows) => {
                                    if (err) {
                                        console.log(`❌ خطأ في جلب البيانات: ${err.message}`);
                                        reject(err);
                                        return;
                                    }
                                    
                                    console.log(`📋 عينة من البيانات:`);
                                    rows.forEach((row, index) => {
                                        console.log(`   ${index + 1}. ${row.day} - ${row.startTime} - القسم: ${row.sectionId} - المادة: ${row.subject || 'غير محدد'}`);
                                    });
                                    resolve();
                                });
                            } else {
                                console.log(`⚪ الجدول فارغ`);
                                resolve();
                            }
                        });
                    } else {
                        console.log(`❌ جدول AdminScheduleEntries غير موجود`);
                        resolve();
                    }
                });
            });
            
            db.close();
            
        } catch (error) {
            console.log(`❌ خطأ في فتح النسخة الاحتياطية: ${error.message}`);
        }
    }
    
    console.log('\n✅ تم الانتهاء من فحص النسخ الاحتياطية');
}

checkScheduleInBackups().catch(console.error);