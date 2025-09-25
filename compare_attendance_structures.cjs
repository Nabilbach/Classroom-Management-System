const sqlite3 = require('sqlite3').verbose();

console.log('🔍 فحص هيكل جدول Attendances في كلا قاعدتي البيانات\n');

function compareAttendanceStructures() {
  return new Promise((resolve) => {
    const currentDb = new sqlite3.Database('classroom.db', sqlite3.OPEN_READONLY);
    const backupDb = new sqlite3.Database('classroom_backup_20250924_174347.db', sqlite3.OPEN_READONLY);
    
    console.log('📋 هيكل جدول Attendances في قاعدة البيانات الحالية:');
    currentDb.all("PRAGMA table_info(Attendances)", (err, currentColumns) => {
      if (err) {
        console.log('❌ خطأ:', err.message);
        currentDb.close();
        backupDb.close();
        resolve();
        return;
      }
      
      currentColumns.forEach((col, index) => {
        console.log(`   ${index + 1}. ${col.name} (${col.type}) - ${col.notnull ? 'مطلوب' : 'اختياري'}`);
      });
      
      console.log('\n📋 هيكل جدول Attendances في النسخة الاحتياطية:');
      backupDb.all("PRAGMA table_info(Attendances)", (err, backupColumns) => {
        if (err) {
          console.log('❌ خطأ:', err.message);
          currentDb.close();
          backupDb.close();
          resolve();
          return;
        }
        
        backupColumns.forEach((col, index) => {
          console.log(`   ${index + 1}. ${col.name} (${col.type}) - ${col.notnull ? 'مطلوب' : 'اختياري'}`);
        });
        
        // مقارنة الهياكل
        const currentCols = new Set(currentColumns.map(c => c.name));
        const backupCols = new Set(backupColumns.map(c => c.name));
        
        const missingInCurrent = backupColumns.filter(c => !currentCols.has(c.name));
        const missingInBackup = currentColumns.filter(c => !backupCols.has(c.name));
        
        console.log('\n🔍 مقارنة الهياكل:');
        
        if (missingInCurrent.length > 0) {
          console.log('\n⚠️ أعمدة موجودة في النسخة الاحتياطية ومفقودة في قاعدة البيانات الحالية:');
          missingInCurrent.forEach(col => {
            console.log(`   - ${col.name} (${col.type})`);
          });
        }
        
        if (missingInBackup.length > 0) {
          console.log('\n⚠️ أعمدة موجودة في قاعدة البيانات الحالية ومفقودة في النسخة الاحتياطية:');
          missingInBackup.forEach(col => {
            console.log(`   - ${col.name} (${col.type})`);
          });
        }
        
        if (missingInCurrent.length === 0 && missingInBackup.length === 0) {
          console.log('✅ هياكل الجداول متطابقة');
        }
        
        // فحص عينة من البيانات الفعلية
        console.log('\n🔍 فحص عينة من البيانات في النسخة الاحتياطية:');
        backupDb.all("SELECT * FROM Attendances WHERE date = '2025-09-23' LIMIT 3", (err, sampleData) => {
          if (!err && sampleData) {
            sampleData.forEach((record, index) => {
              console.log(`\n📄 سجل ${index + 1}:`);
              Object.keys(record).forEach(key => {
                console.log(`   ${key}: ${record[key]}`);
              });
            });
          }
          
          console.log('\n🔍 فحص عينة من البيانات في قاعدة البيانات الحالية:');
          currentDb.all("SELECT * FROM Attendances WHERE date = '2025-09-23' LIMIT 3", (err, currentSampleData) => {
            if (!err && currentSampleData) {
              currentSampleData.forEach((record, index) => {
                console.log(`\n📄 سجل ${index + 1}:`);
                Object.keys(record).forEach(key => {
                  console.log(`   ${key}: ${record[key]}`);
                });
              });
            }
            
            currentDb.close();
            backupDb.close();
            resolve();
          });
        });
      });
    });
  });
}

compareAttendanceStructures().catch(console.error);