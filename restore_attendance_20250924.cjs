const sqlite3 = require('sqlite3').verbose();

console.log('🔄 استعادة سجلات الحضور المفقودة ليوم 24-09-2025\n');

function restoreAttendance20250924() {
  return new Promise((resolve) => {
    const currentDb = new sqlite3.Database('classroom.db', sqlite3.OPEN_READWRITE);
    const backupDb = new sqlite3.Database('classroom_backup_20250924_174347.db', sqlite3.OPEN_READONLY);
    const targetDate = '2025-09-24';
    
    console.log(`🎯 استعادة سجلات ${targetDate}...`);
    
    // التحقق من وجود السجلات في قاعدة البيانات الحالية
    currentDb.get(`SELECT COUNT(*) as count FROM Attendances WHERE date = ?`, [targetDate], (err, currentCount) => {
      if (err) {
        console.log('❌ خطأ في فحص السجلات الحالية:', err.message);
        currentDb.close();
        backupDb.close();
        resolve();
        return;
      }
      
      console.log(`📊 السجلات الحالية في ${targetDate}: ${currentCount.count}`);
      
      // جلب السجلات من النسخة الاحتياطية
      backupDb.all(`SELECT * FROM Attendances WHERE date = ? ORDER BY createdAt`, [targetDate], (err, missingRecords) => {
        if (err) {
          console.log('❌ خطأ في قراءة النسخة الاحتياطية:', err.message);
          backupDb.close();
          currentDb.close();
          resolve();
          return;
        }
        
        if (!missingRecords || missingRecords.length === 0) {
          console.log('⚠️ لم يتم العثور على سجلات في النسخة الاحتياطية');
          backupDb.close();
          currentDb.close();
          resolve();
          return;
        }
        
        console.log(`✅ تم العثور على ${missingRecords.length} سجل للاستعادة`);
        
        // عرض تفاصيل السجلات
        console.log('\n📋 تفاصيل السجلات المراد استعادتها:');
        const bySection = {};
        missingRecords.forEach(record => {
          if (!bySection[record.sectionId]) {
            bySection[record.sectionId] = { total: 0, present: 0, absent: 0 };
          }
          bySection[record.sectionId].total++;
          if (record.isPresent === 1) {
            bySection[record.sectionId].present++;
          } else {
            bySection[record.sectionId].absent++;
          }
        });
        
        Object.keys(bySection).forEach(sectionId => {
          const section = bySection[sectionId];
          console.log(`📚 القسم ${sectionId}: ${section.total} طالب (${section.present} حاضر، ${section.absent} غائب)`);
        });
        
        // إدراج السجلات
        const insertQuery = `
          INSERT INTO Attendances (id, studentId, sectionId, date, isPresent, createdAt, updatedAt) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        let insertedCount = 0;
        let errors = [];
        
        console.log('\n🔄 بدء عملية الاستعادة...');
        
        const insertPromises = missingRecords.map((record, index) => {
          return new Promise((resolveInsert) => {
            currentDb.run(insertQuery, [
              record.id,
              record.studentId,
              record.sectionId,
              record.date,
              record.isPresent,
              record.createdAt,
              record.updatedAt
            ], function(err) {
              if (err) {
                errors.push(`❌ خطأ في إدراج السجل ${record.id}: ${err.message}`);
              } else {
                insertedCount++;
                if (insertedCount % 10 === 0 || insertedCount === missingRecords.length) {
                  console.log(`✅ تم استعادة ${insertedCount}/${missingRecords.length} سجل`);
                }
              }
              resolveInsert();
            });
          });
        });
        
        Promise.all(insertPromises).then(() => {
          console.log(`\n📊 تقرير الاستعادة:`);
          console.log(`✅ السجلات المستعادة: ${insertedCount}`);
          console.log(`❌ الأخطاء: ${errors.length}`);
          
          if (errors.length > 0) {
            console.log('\n🚨 أول 3 أخطاء:');
            errors.slice(0, 3).forEach(error => console.log(error));
          }
          
          if (insertedCount > 0) {
            console.log('\n🎉 تم استعادة سجلات الحضور بنجاح!');
            
            // التحقق من النتيجة النهائية
            currentDb.get(`SELECT COUNT(*) as total FROM Attendances WHERE date = ?`, [targetDate], (err, result) => {
              if (!err && result) {
                console.log(`📈 إجمالي السجلات الآن ليوم ${targetDate}: ${result.total}`);
              }
              
              // إحصائيات نهائية
              currentDb.all(`
                SELECT 
                  sectionId,
                  COUNT(*) as total,
                  SUM(CASE WHEN isPresent = 1 THEN 1 ELSE 0 END) as present,
                  SUM(CASE WHEN isPresent = 0 THEN 1 ELSE 0 END) as absent
                FROM Attendances 
                WHERE date = ?
                GROUP BY sectionId
              `, [targetDate], (err, finalStats) => {
                
                if (!err && finalStats) {
                  console.log(`\n📊 إحصائيات الحضور النهائية ليوم ${targetDate}:`);
                  finalStats.forEach((section, index) => {
                    console.log(`${index + 1}. القسم ${section.sectionId}: ${section.total} طالب (${section.present} حاضر، ${section.absent} غائب)`);
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
  });
}

restoreAttendance20250924().catch(console.error);