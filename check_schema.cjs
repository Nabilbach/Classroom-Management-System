const sqlite3 = require('sqlite3').verbose();

console.log('=== فحص هيكل قاعدة البيانات ===');

// فحص قاعدة البيانات الحالية
const currentDb = new sqlite3.Database('classroom.db');
currentDb.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='LessonTemplates'", (err, rows) => {
  if (err) {
    console.log('خطأ في قراءة هيكل LessonTemplates:', err.message);
  } else {
    console.log('\nهيكل جدول LessonTemplates الحالي:');
    if (rows.length > 0) {
      console.log(rows[0].sql);
    } else {
      console.log('جدول LessonTemplates غير موجود!');
    }
  }
  
  // فحص جدول audit_log
  currentDb.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='audit_log'", (err, rows) => {
    if (err) {
      console.log('خطأ في قراءة هيكل audit_log:', err.message);
    } else {
      console.log('\nهيكل جدول audit_log الحالي:');
      if (rows.length > 0) {
        console.log(rows[0].sql);
      } else {
        console.log('جدول audit_log غير موجود!');
      }
    }
    
    currentDb.close();
    
    // فحص النسخة الاحتياطية
    console.log('\n=== فحص النسخة الاحتياطية ===');
    const backupDb = new sqlite3.Database('classroom_backup_20250924_174347.db');
    
    backupDb.all('SELECT COUNT(*) as count FROM LessonTemplates', (err, rows) => {
      if (err) {
        console.log('خطأ في قراءة النسخة الاحتياطية:', err.message);
      } else {
        console.log('عدد قوالب الدروس في النسخة الاحتياطية:', rows[0].count);
      }
      
      // فحص هيكل الجدول في النسخة الاحتياطية
      backupDb.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='LessonTemplates'", (err, rows) => {
        if (err) {
          console.log('خطأ في قراءة هيكل النسخة الاحتياطية:', err.message);
        } else {
          console.log('\nهيكل جدول LessonTemplates في النسخة الاحتياطية:');
          if (rows.length > 0) {
            console.log(rows[0].sql);
          }
        }
        
        backupDb.close();
        console.log('\n=== انتهى فحص الهيكل ===');
      });
    });
  });
});