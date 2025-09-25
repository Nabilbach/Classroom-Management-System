const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'classroom.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 فحص قوالب الدروس...');

db.serialize(() => {
  // التحقق من وجود جدول LessonTemplates
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='LessonTemplates'", (err, row) => {
    if (err) {
      console.log('❌ خطأ في فحص الجداول:', err.message);
    } else if (row) {
      console.log('✅ تم العثور على جدول LessonTemplates');
      
      // عد القوالب
      db.get("SELECT COUNT(*) as count FROM LessonTemplates", (err, result) => {
        if (err) {
          console.log('❌ خطأ في عد القوالب:', err.message);
        } else {
          console.log('📊 عدد القوالب في قاعدة البيانات:', result.count);
          
          if (result.count > 0) {
            // عرض عينة من القوالب
            db.all("SELECT id, title, subject, grade FROM LessonTemplates LIMIT 10", (err, rows) => {
              if (err) {
                console.log('❌ خطأ في جلب القوالب:', err.message);
              } else {
                console.log('📚 عينة من القوالب:');
                rows.forEach(row => {
                  console.log(`  - ${row.title} (${row.subject} - ${row.grade})`);
                });
              }
              db.close();
            });
          } else {
            console.log('⚠️ لا توجد قوالب في قاعدة البيانات');
            db.close();
          }
        }
      });
    } else {
      console.log('❌ جدول LessonTemplates غير موجود');
      
      // عرض جميع الجداول المتاحة
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
          console.log('❌ خطأ في جلب الجداول:', err.message);
        } else {
          console.log('📋 الجداول المتاحة:');
          tables.forEach(table => console.log(`  - ${table.name}`));
        }
        db.close();
      });
    }
  });
});