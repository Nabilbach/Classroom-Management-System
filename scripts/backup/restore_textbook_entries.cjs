const sqlite3 = require('sqlite3').verbose();

console.log('🔄 استعادة إدخالات دفتر النصوص المفقودة ليوم 23-09-2025\n');

function restoreTextbookEntries() {
  return new Promise((resolve) => {
    const currentDb = new sqlite3.Database('classroom.db', sqlite3.OPEN_READWRITE);
    const backupDb = new sqlite3.Database('classroom_backup_20250924_174347.db', sqlite3.OPEN_READONLY);
    const targetDate = '2025-09-23';
    
    console.log(`🎯 استعادة إدخالات دفتر النصوص لتاريخ ${targetDate}...`);
    
    // جلب الإدخالات المفقودة من النسخة الاحتياطية
    backupDb.all(`SELECT * FROM TextbookEntries WHERE date = ? ORDER BY createdAt`, [targetDate], (err, missingEntries) => {
      if (err) {
        console.log('❌ خطأ في قراءة النسخة الاحتياطية:', err.message);
        backupDb.close();
        currentDb.close();
        resolve();
        return;
      }
      
      if (!missingEntries || missingEntries.length === 0) {
        console.log('⚠️ لم يتم العثور على إدخالات في النسخة الاحتياطية');
        backupDb.close();
        currentDb.close();
        resolve();
        return;
      }
      
      console.log(`✅ تم العثور على ${missingEntries.length} إدخال للاستعادة`);
      
      // عرض تفاصيل الإدخالات المراد استعادتها
      console.log('\n📋 إدخالات دفتر النصوص المراد استعادتها:');
      missingEntries.forEach((entry, index) => {
        console.log(`${index + 1}. قسم: ${entry.sectionId}`);
        console.log(`   📚 عنوان الدرس: ${entry.lessonTitle || 'غير محدد'}`);
        console.log(`   ⏰ الوقت: ${entry.startTime || 'غير محدد'}`);
        console.log(`   📝 المحتوى: ${entry.lessonContent ? entry.lessonContent.substring(0, 50) + '...' : 'غير محدد'}`);
        console.log('   ---');
      });
      
      // فحص هيكل الجدول أولاً
      currentDb.all("PRAGMA table_info(TextbookEntries)", (err, columns) => {
        if (err) {
          console.log('❌ خطأ في فحص هيكل الجدول:', err.message);
          backupDb.close();
          currentDb.close();
          resolve();
          return;
        }
        
        console.log('\n📋 أعمدة جدول TextbookEntries:');
        const columnNames = columns.map(col => col.name);
        columnNames.forEach((col, index) => {
          console.log(`   ${index + 1}. ${col}`);
        });
        
        // تحضير استعلام الإدراج
        const placeholders = columnNames.map(() => '?').join(',');
        const insertQuery = `INSERT INTO TextbookEntries (${columnNames.join(',')}) VALUES (${placeholders})`;
        
        console.log('\n🔄 بدء عملية الاستعادة...');
        
        let insertedCount = 0;
        let errors = [];
        
        const insertPromises = missingEntries.map((entry, index) => {
          return new Promise((resolveInsert) => {
            // تحضير القيم بنفس ترتيب الأعمدة
            const values = columnNames.map(colName => entry[colName]);
            
            currentDb.run(insertQuery, values, function(err) {
              if (err) {
                errors.push(`❌ خطأ في إدراج الإدخال ${entry.id}: ${err.message}`);
              } else {
                insertedCount++;
                console.log(`✅ تم استعادة إدخال ${insertedCount}/${missingEntries.length}: ${entry.lessonTitle}`);
              }
              resolveInsert();
            });
          });
        });
        
        Promise.all(insertPromises).then(() => {
          console.log(`\n📊 تقرير الاستعادة:`);
          console.log(`✅ الإدخالات المستعادة: ${insertedCount}`);
          console.log(`❌ الأخطاء: ${errors.length}`);
          
          if (errors.length > 0) {
            console.log('\n🚨 الأخطاء:');
            errors.forEach(error => console.log(error));
          }
          
          if (insertedCount > 0) {
            console.log('\n🎉 تم استعادة إدخالات دفتر النصوص بنجاح!');
            
            // التحقق من النتيجة النهائية
            currentDb.get(`SELECT COUNT(*) as total FROM TextbookEntries WHERE date = ?`, [targetDate], (err, result) => {
              if (!err && result) {
                console.log(`📈 إجمالي إدخالات دفتر النصوص ليوم ${targetDate}: ${result.total}`);
              }
              
              // عرض الإدخالات المستعادة
              currentDb.all(`
                SELECT 
                  sectionId,
                  lessonTitle,
                  startTime,
                  lessonContent
                FROM TextbookEntries 
                WHERE date = ?
                ORDER BY startTime
              `, [targetDate], (err, finalEntries) => {
                
                if (!err && finalEntries) {
                  console.log(`\n📖 إدخالات دفتر النصوص ليوم ${targetDate}:`);
                  finalEntries.forEach((entry, index) => {
                    console.log(`${index + 1}. قسم: ${entry.sectionId}`);
                    console.log(`   📚 العنوان: ${entry.lessonTitle}`);
                    console.log(`   ⏰ الوقت: ${entry.startTime}`);
                    console.log(`   📝 المحتوى: ${entry.lessonContent ? entry.lessonContent.substring(0, 60) + '...' : 'غير محدد'}`);
                  });
                }
                
                // التحقق من الحالة العامة
                currentDb.get(`SELECT COUNT(*) as total FROM TextbookEntries`, (err, totalResult) => {
                  if (!err && totalResult) {
                    console.log(`\n📊 إجمالي إدخالات دفتر النصوص في النظام: ${totalResult.total}`);
                  }
                  
                  console.log('\n' + '='.repeat(70));
                  console.log('🎯 النتيجة:');
                  console.log('✅ الحصص المجدولة: ظاهرة في التقويم');
                  console.log('✅ إدخالات دفتر النصوص: تم استعادتها بنجاح');
                  console.log('💡 الآن يجب أن تظهر الدروس في دفتر النصوص');
                  
                  backupDb.close();
                  currentDb.close();
                  resolve();
                });
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

restoreTextbookEntries().catch(console.error);