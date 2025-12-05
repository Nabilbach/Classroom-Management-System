const sqlite3 = require('sqlite3').verbose();

console.log('🔍 فحص جدول TextbookEntry (دفتر النصوص الفعلي)\n');

function investigateTextbookEntries() {
  return new Promise((resolve) => {
    const currentDb = new sqlite3.Database('classroom.db', sqlite3.OPEN_READONLY);
    const backupDb = new sqlite3.Database('classroom_backup_20250924_174347.db', sqlite3.OPEN_READONLY);
    
    console.log('1️⃣ فحص جدول TextbookEntries (دفتر النصوص الحقيقي):');
    
    // فحص هيكل الجدول
    currentDb.all("PRAGMA table_info(TextbookEntries)", (err, columns) => {
      if (err) {
        console.log('❌ خطأ في فحص هيكل الجدول:', err.message);
        
        // ربما الاسم مختلف
        currentDb.all(`SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%textbook%'`, (err, textbookTables) => {
          if (!err && textbookTables) {
            console.log('📋 جداول دفتر النصوص الموجودة:');
            textbookTables.forEach((table, index) => {
              console.log(`   ${index + 1}. ${table.name}`);
            });
            
            if (textbookTables.length > 0) {
              const tableName = textbookTables[0].name;
              checkTextbookTable(currentDb, backupDb, tableName, resolve);
            } else {
              console.log('❌ لم يتم العثور على جداول دفتر النصوص');
              currentDb.close();
              backupDb.close();
              resolve();
            }
          } else {
            console.log('❌ لم يتم العثور على جداول دفتر النصوص');
            currentDb.close();
            backupDb.close();
            resolve();
          }
        });
      } else {
        checkTextbookTable(currentDb, backupDb, 'TextbookEntries', resolve);
      }
    });
  });
}

function checkTextbookTable(currentDb, backupDb, tableName, resolve) {
  console.log(`\n📖 فحص جدول ${tableName}:`);
  
  // فحص البيانات الحالية
  currentDb.all(`SELECT * FROM ${tableName} ORDER BY date DESC`, (err, currentEntries) => {
    if (err) {
      console.log('❌ خطأ في قراءة الجدول الحالي:', err.message);
    } else {
      console.log(`📊 إدخالات دفتر النصوص الحالية: ${currentEntries ? currentEntries.length : 0}`);
      
      if (currentEntries && currentEntries.length > 0) {
        console.log('📋 عينة من إدخالات دفتر النصوص:');
        currentEntries.slice(0, 5).forEach((entry, index) => {
          console.log(`   ${index + 1}. تاريخ: ${entry.date} - قسم: ${entry.sectionId} - عنوان: ${entry.lessonTitle || 'غير محدد'}`);
        });
        
        // فحص للأيام المتأثرة
        const targetDates = ['2025-09-23', '2025-09-24'];
        console.log('\n🎯 البحث عن إدخالات الأيام المتأثرة:');
        
        targetDates.forEach(date => {
          const dateEntries = currentEntries.filter(e => e.date === date);
          console.log(`📅 ${date}: ${dateEntries.length} إدخال في دفتر النصوص`);
          
          if (dateEntries.length > 0) {
            dateEntries.forEach((entry, index) => {
              console.log(`   ${index + 1}. قسم: ${entry.sectionId} - عنوان: ${entry.lessonTitle || entry.subjectDetails || 'غير محدد'}`);
            });
          }
        });
      }
    }
    
    // فحص النسخة الاحتياطية
    backupDb.all(`SELECT * FROM ${tableName} ORDER BY date DESC`, (err, backupEntries) => {
      if (err) {
        console.log('❌ خطأ في قراءة النسخة الاحتياطية:', err.message);
      } else {
        console.log(`\n📊 إدخالات دفتر النصوص في النسخة الاحتياطية: ${backupEntries ? backupEntries.length : 0}`);
        
        if (backupEntries && backupEntries.length > 0) {
          console.log('📋 عينة من النسخة الاحتياطية:');
          backupEntries.slice(0, 3).forEach((entry, index) => {
            console.log(`   ${index + 1}. تاريخ: ${entry.date} - قسم: ${entry.sectionId} - عنوان: ${entry.lessonTitle || 'غير محدد'}`);
          });
          
          // البحث عن إدخالات للأيام المتأثرة
          const targetDates = ['2025-09-23', '2025-09-24'];
          console.log('\n🎯 البحث عن إدخالات الأيام المتأثرة في النسخة الاحتياطية:');
          
          let totalMissing = 0;
          
          targetDates.forEach(date => {
            const currentDateEntries = currentEntries ? currentEntries.filter(e => e.date === date) : [];
            const backupDateEntries = backupEntries.filter(e => e.date === date);
            
            console.log(`\n📅 ${date}:`);
            console.log(`   📊 قاعدة البيانات الحالية: ${currentDateEntries.length} إدخال`);
            console.log(`   📊 النسخة الاحتياطية: ${backupDateEntries.length} إدخال`);
            
            const missingCount = backupDateEntries.length - currentDateEntries.length;
            if (missingCount > 0) {
              console.log(`   🚨 مفقود: ${missingCount} إدخال`);
              totalMissing += missingCount;
              
              // عرض الإدخالات المفقودة
              const currentIds = new Set(currentDateEntries.map(e => e.id));
              const missingEntries = backupDateEntries.filter(e => !currentIds.has(e.id));
              
              console.log(`   📋 الإدخالات المفقودة:`);
              missingEntries.forEach((entry, index) => {
                console.log(`     ${index + 1}. قسم: ${entry.sectionId} - عنوان: ${entry.lessonTitle || 'غير محدد'}`);
              });
            } else {
              console.log(`   ✅ سليم`);
            }
          });
          
          console.log('\n' + '='.repeat(70));
          console.log('🎯 النتيجة النهائية:');
          
          if (totalMissing > 0) {
            console.log(`🚨 إجمالي إدخالات دفتر النصوص المفقودة: ${totalMissing}`);
            console.log('💡 هذا يفسر سبب اختفاء الدروس من دفتر النصوص مع ظهورها في التقويم');
            console.log('✅ الحصص المجدولة: موجودة في ScheduledLessons (التقويم)');
            console.log('🚨 إدخالات دفتر النصوص: مفقودة من TextbookEntries');
          } else {
            console.log('✅ جميع إدخالات دفتر النصوص سليمة');
          }
        }
      }
      
      currentDb.close();
      backupDb.close();
      resolve();
    });
  });
}

investigateTextbookEntries().catch(console.error);