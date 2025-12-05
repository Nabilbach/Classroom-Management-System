const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./classroom.db');

console.log('🔍 فحص جدول LessonTemplates...\n');

// التحقق من وجود الجدول
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='LessonTemplates'", (err, row) => {
  if (err) {
    console.error('❌ خطأ:', err);
    db.close();
    return;
  }
  
  if (!row) {
    console.log('❌ جدول LessonTemplates غير موجود في قاعدة البيانات!');
    console.log('📝 يجب إنشاء الجدول أولاً.\n');
    db.close();
    return;
  }
  
  console.log('✅ جدول LessonTemplates موجود\n');
  
  // عد القوالب
  db.get("SELECT COUNT(*) as count FROM LessonTemplates", (err, row) => {
    if (err) {
      console.error('❌ خطأ في العد:', err);
    } else {
      console.log(`📊 عدد القوالب في قاعدة البيانات: ${row.count}`);
    }
    
    // عرض أول 5 قوالب
    db.all("SELECT id, title, subject, grade FROM LessonTemplates LIMIT 5", (err, rows) => {
      if (err) {
        console.error('❌ خطأ في جلب القوالب:', err);
      } else if (rows.length > 0) {
        console.log('\n📚 أول 5 قوالب:');
        rows.forEach((row, i) => {
          console.log(`  ${i + 1}. ${row.title} - ${row.subject} (${row.grade})`);
        });
      }
      console.log('');
      db.close();
    });
  });
});
