const sqlite3 = require('sqlite3').verbose();

console.log('🔄 استعادة سجلات الحضور والغياب المفقودة ليوم 23-09-2025\n');

function restoreAttendanceRecords() {
  return new Promise((resolve) => {
    const currentDb = new sqlite3.Database('classroom.db', sqlite3.OPEN_READWRITE);
    const backupDb = new sqlite3.Database('classroom_backup_20250924_174347.db', sqlite3.OPEN_READONLY);
    const targetDate = '2025-09-23';
    
    console.log(`🎯 استعادة سجلات ${targetDate}...`);
    
    // جلب السجلات المفقودة من النسخة الاحتياطية
    backupDb.all(`SELECT * FROM Attendances WHERE date = ?`, [targetDate], (err, missingRecords) => {
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
      
      // فحص هيكل جدول Attendances أولاً
      currentDb.all("PRAGMA table_info(Attendances)", (err, columns) => {
        if (err) {
          console.log('❌ خطأ في فحص هيكل الجدول:', err.message);
          backupDb.close();
          currentDb.close();
          resolve();
          return;
        }
        
        console.log('📋 أعمدة جدول Attendances:');
        const columnNames = columns.map(col => col.name);
        columnNames.forEach((col, index) => {
          console.log(`   ${index + 1}. ${col}`);
        });
        
        // تحضير استعلام الإدراج
        const placeholders = columnNames.map(() => '?').join(',');
        const insertQuery = `INSERT INTO Attendances (${columnNames.join(',')}) VALUES (${placeholders})`;
        
        console.log('\n🔄 بدء عملية الاستعادة...');
        
        let insertedCount = 0;
        let errors = [];
        
        const insertPromises = missingRecords.map((record, index) => {
          return new Promise((resolveInsert) => {
            // تحضير القيم بنفس ترتيب الأعمدة
            const values = columnNames.map(colName => record[colName]);
            
            currentDb.run(insertQuery, values, function(err) {
              if (err) {
                errors.push(`❌ خطأ في إدراج السجل ${record.id}: ${err.message}`);
              } else {
                insertedCount++;
                if (insertedCount % 20 === 0 || insertedCount === missingRecords.length) {
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
            console.log('\n🚨 أول 5 أخطاء:');
            errors.slice(0, 5).forEach(error => console.log(error));
          }
          
          if (insertedCount > 0) {
            console.log('\n🎉 تم استعادة سجلات الحضور والغياب بنجاح!');
            
            // التحقق من النتيجة النهائية
            currentDb.all(`SELECT 
                sectionId, 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
                SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late
              FROM Attendances 
              WHERE date = ? 
              GROUP BY sectionId`, [targetDate], (err, summary) => {
              
              if (!err && summary) {
                console.log(`\n📊 ملخص الحضور والغياب ليوم ${targetDate}:`);
                summary.forEach((section, index) => {
                  console.log(`${index + 1}. القسم ${section.sectionId}:`);
                  console.log(`   📈 إجمالي: ${section.total}`);
                  console.log(`   ✅ حاضر: ${section.present}`);
                  console.log(`   ❌ غائب: ${section.absent}`);
                  console.log(`   ⏰ متأخر: ${section.late}`);
                });
                
                const totalRecords = summary.reduce((sum, s) => sum + s.total, 0);
                console.log(`\n🎯 إجمالي السجلات المستعادة: ${totalRecords}`);
              }
              
              backupDb.close();
              currentDb.close();
              resolve();
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

restoreAttendanceRecords().catch(console.error);