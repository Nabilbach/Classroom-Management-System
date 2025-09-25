const sqlite3 = require('sqlite3').verbose();

console.log('🔍 التحقق من IDs الحصص في النسخة الاحتياطية\n');

const backupDb = new sqlite3.Database('classroom_backup_20250924_174347.db', sqlite3.OPEN_READONLY);

backupDb.all('SELECT id, date, subject, customTitle FROM ScheduledLessons ORDER BY createdAt', (err, lessons) => {
  if (err) {
    console.log('❌ خطأ:', err.message);
    return;
  }
  
  console.log('📋 جميع IDs في النسخة الاحتياطية:');
  lessons.forEach((lesson, index) => {
    console.log(`${index + 1}. ID: ${lesson.id} - ${lesson.date} - ${lesson.subject || lesson.customTitle}`);
  });
  
  // التحقق من قاعدة البيانات الحالية
  const currentDb = new sqlite3.Database('classroom.db', sqlite3.OPEN_READONLY);
  
  currentDb.all('SELECT id, date, subject, customTitle FROM ScheduledLessons ORDER BY createdAt', (err, currentLessons) => {
    if (err) {
      console.log('❌ خطأ في قاعدة البيانات الحالية:', err.message);
      backupDb.close();
      currentDb.close();
      return;
    }
    
    console.log('\n📋 جميع IDs في قاعدة البيانات الحالية:');
    currentLessons.forEach((lesson, index) => {
      console.log(`${index + 1}. ID: ${lesson.id} - ${lesson.date} - ${lesson.subject || lesson.customTitle}`);
    });
    
    // العثور على الفروق
    const currentIds = new Set(currentLessons.map(l => String(l.id)));
    const missingLessons = lessons.filter(l => !currentIds.has(String(l.id)));
    
    console.log('\n🚨 الحصص المفقودة (IDs):');
    missingLessons.forEach((lesson, index) => {
      console.log(`${index + 1}. ID: ${lesson.id} (${typeof lesson.id}) - ${lesson.date} - ${lesson.subject || lesson.customTitle}`);
    });
    
    backupDb.close();
    currentDb.close();
  });
});