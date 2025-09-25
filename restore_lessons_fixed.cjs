const sqlite3 = require('sqlite3').verbose();

console.log('🔄 استعادة الحصص المفقودة (الإصدار المصحح)\n');

const missingLessonIds = [
  '1758639223860',  // 2025-09-23
  '1758643311467',  // 2025-09-23
  '1758643398060',  // 2025-09-26
  '1758646933101',  // 2025-09-23
  '1758649182937',  // 2025-09-23
  '1758702426148',  // 2025-09-24
  '1758702584653'   // 2025-09-24
];

function restoreMissingLessons() {
  return new Promise((resolve) => {
    const currentDb = new sqlite3.Database('classroom.db', sqlite3.OPEN_READWRITE);
    const backupDb = new sqlite3.Database('classroom_backup_20250924_174347.db', sqlite3.OPEN_READONLY);
    
    console.log('🔍 جلب الحصص المفقودة من النسخة الاحتياطية...');
    console.log(`🎯 البحث عن ${missingLessonIds.length} حصة مفقودة`);
    
    const placeholders = missingLessonIds.map(() => '?').join(',');
    const query = `SELECT * FROM ScheduledLessons WHERE id IN (${placeholders})`;
    
    backupDb.all(query, missingLessonIds, (err, missingLessons) => {
      if (err) {
        console.log('❌ خطأ في قراءة الحصص المفقودة:', err.message);
        backupDb.close();
        currentDb.close();
        resolve();
        return;
      }
      
      console.log(`✅ تم العثور على ${missingLessons.length} حصة للاستعادة`);
      
      if (missingLessons.length === 0) {
        console.log('⚠️ لم يتم العثور على حصص للاستعادة');
        backupDb.close();
        currentDb.close();
        resolve();
        return;
      }
      
      console.log('\n📋 الحصص المراد استعادتها:');
      missingLessons.forEach((lesson, index) => {
        console.log(`${index + 1}. ID: ${lesson.id} - ${lesson.date} - ${lesson.subject || lesson.customTitle}`);
      });
      
      // إدراج الحصص المفقودة في قاعدة البيانات الحالية
      const insertQuery = `
        INSERT INTO ScheduledLessons (
          id, subject, customTitle, startTime, endTime, date, 
          assignedSections, completionStatus, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      let insertedCount = 0;
      let errors = [];
      
      const insertPromises = missingLessons.map((lesson) => {
        return new Promise((resolveInsert) => {
          currentDb.run(insertQuery, [
            lesson.id,
            lesson.subject,
            lesson.customTitle,
            lesson.startTime,
            lesson.endTime,
            lesson.date,
            lesson.assignedSections,
            lesson.completionStatus,
            lesson.createdAt,
            lesson.updatedAt
          ], function(err) {
            if (err) {
              errors.push(`❌ خطأ في إدراج الحصة ${lesson.id}: ${err.message}`);
            } else {
              insertedCount++;
              console.log(`✅ تم استعادة الحصة ${lesson.id} - ${lesson.date}`);
            }
            resolveInsert();
          });
        });
      });
      
      Promise.all(insertPromises).then(() => {
        console.log(`\n📊 تقرير الاستعادة:`);
        console.log(`✅ الحصص المستعادة: ${insertedCount}`);
        console.log(`❌ الأخطاء: ${errors.length}`);
        
        if (errors.length > 0) {
          console.log('\n🚨 الأخطاء:');
          errors.forEach(error => console.log(error));
        }
        
        if (insertedCount > 0) {
          console.log('\n🎉 تم استعادة الحصص المفقودة بنجاح!');
          
          // التحقق من النتيجة النهائية
          currentDb.get('SELECT COUNT(*) as count FROM ScheduledLessons', (err, result) => {
            if (!err) {
              console.log(`📈 إجمالي الحصص الآن: ${result.count}`);
            }
            
            // عرض الحصص مرتبة حسب التاريخ
            currentDb.all('SELECT id, date, subject, customTitle FROM ScheduledLessons ORDER BY date', (err, allLessons) => {
              if (!err) {
                console.log('\n📅 جميع الحصص المجدولة الآن:');
                allLessons.forEach((lesson, index) => {
                  console.log(`${index + 1}. ${lesson.date} - ${lesson.subject || lesson.customTitle} (ID: ${lesson.id})`);
                });
              }
              
              backupDb.close();
              currentDb.close();
              resolve();
            });
          });
        } else {
          backupDb.close();
          currentDb.close();
          resolve();
        }
      });
    });
  });
}

restoreMissingLessons().catch(console.error);