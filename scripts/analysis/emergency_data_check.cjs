const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('classroom.db');

console.log('=== فحص البيانات المفقودة ===');

// فحص عدد قوالب الدروس
db.all('SELECT COUNT(*) as count FROM LessonTemplates', (err, rows) => {
  if (err) {
    console.log('خطأ في LessonTemplates:', err.message);
  } else {
    console.log('عدد قوالب الدروس الحالية:', rows[0].count);
  }
});

// فحص قوالب الدروس المتبقية
db.all('SELECT id, name, subject FROM LessonTemplates', (err, rows) => {
  if (err) {
    console.log('خطأ في قراءة قوالب الدروس:', err.message);
  } else {
    console.log('\nقوالب الدروس المتبقية:');
    rows.forEach(row => {
      console.log(`- ID: ${row.id}, الاسم: ${row.name}, المادة: ${row.subject}`);
    });
  }
});

// فحص سجل التدقيق للحذف
db.all(`SELECT * FROM audit_log 
        WHERE table_name = 'LessonTemplates' AND operation = 'DELETE' 
        ORDER BY timestamp DESC LIMIT 20`, (err, rows) => {
  if (err) {
    console.log('خطأ في سجل التدقيق:', err.message);
  } else {
    console.log('\nعمليات حذف قوالب الدروس الأخيرة:');
    if (rows.length === 0) {
      console.log('لا توجد عمليات حذف مسجلة');
    } else {
      rows.forEach(row => {
        console.log(`- ${row.timestamp}: حذف السجل ${row.record_id}`);
      });
    }
  }
});

// فحص النسخ الاحتياطية المتاحة
const fs = require('fs');
console.log('\nالنسخ الاحتياطية المتاحة:');
try {
  const files = fs.readdirSync('.');
  const backups = files.filter(f => f.includes('backup') && f.endsWith('.db'));
  backups.forEach(backup => {
    const stat = fs.statSync(backup);
    console.log(`- ${backup} (${stat.mtime.toLocaleString()})`);
  });
} catch (e) {
  console.log('خطأ في قراءة النسخ الاحتياطية:', e.message);
}

// إغلاق قاعدة البيانات
setTimeout(() => {
  db.close();
  console.log('\n=== انتهى الفحص ===');
}, 2000);