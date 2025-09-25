const sqlite3 = require('sqlite3').verbose();

console.log('🔍 فحص هيكل جدول ScheduledLessons\n');

const currentDb = new sqlite3.Database('classroom.db', sqlite3.OPEN_READONLY);

currentDb.all("PRAGMA table_info(ScheduledLessons)", (err, columns) => {
  if (err) {
    console.log('❌ خطأ في قراءة هيكل الجدول:', err.message);
    currentDb.close();
    return;
  }
  
  console.log('📋 أعمدة جدول ScheduledLessons في قاعدة البيانات الحالية:');
  columns.forEach((col, index) => {
    console.log(`${index + 1}. ${col.name} (${col.type}) - ${col.notnull ? 'مطلوب' : 'اختياري'}`);
  });
  
  currentDb.close();
  
  // فحص النسخة الاحتياطية أيضاً
  const backupDb = new sqlite3.Database('classroom_backup_20250924_174347.db', sqlite3.OPEN_READONLY);
  
  backupDb.all("PRAGMA table_info(ScheduledLessons)", (err, backupColumns) => {
    if (err) {
      console.log('❌ خطأ في قراءة هيكل الجدول من النسخة الاحتياطية:', err.message);
      backupDb.close();
      return;
    }
    
    console.log('\n📋 أعمدة جدول ScheduledLessons في النسخة الاحتياطية:');
    backupColumns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.name} (${col.type}) - ${col.notnull ? 'مطلوب' : 'اختياري'}`);
    });
    
    // مقارنة الأعمدة
    const currentCols = new Set(columns.map(c => c.name));
    const backupCols = new Set(backupColumns.map(c => c.name));
    
    const missingInCurrent = backupColumns.filter(c => !currentCols.has(c.name));
    const missingInBackup = columns.filter(c => !backupCols.has(c.name));
    
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
      console.log('\n✅ هياكل الجداول متطابقة');
    }
    
    backupDb.close();
  });
});