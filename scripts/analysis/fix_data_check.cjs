const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('classroom.db');

console.log('=== إصلاح وفحص البيانات ===');

// فحص قوالب الدروس الصحيحة
db.all('SELECT id, title, subject, grade FROM LessonTemplates', (err, rows) => {
  if (err) {
    console.log('خطأ في قراءة قوالب الدروس:', err.message);
  } else {
    console.log('\nقوالب الدروس الحالية:');
    console.log('العدد:', rows.length);
    rows.forEach(row => {
      console.log(`- ID: ${row.id}`);
      console.log(`  العنوان: ${row.title}`);
      console.log(`  المادة: ${row.subject}`);
      console.log(`  المستوى: ${row.grade}`);
      console.log('---');
    });
  }
});

// فحص سجل التدقيق الصحيح
db.all(`SELECT * FROM audit_log 
        WHERE table_name = 'LessonTemplates' AND action_type = 'DELETE' 
        ORDER BY timestamp DESC LIMIT 10`, (err, rows) => {
  if (err) {
    console.log('خطأ في سجل التدقيق:', err.message);
  } else {
    console.log('\nعمليات حذف قوالب الدروس:');
    if (rows.length === 0) {
      console.log('لا توجد عمليات حذف مسجلة');
    } else {
      rows.forEach(row => {
        console.log(`- ${row.timestamp}: ${row.action_type} السجل ${row.record_id}`);
      });
    }
  }
});

// فحص جدول الأحداث في التقويم
db.all('SELECT COUNT(*) as count FROM AdminScheduleEntries', (err, rows) => {
  if (err) {
    console.log('خطأ في AdminScheduleEntries:', err.message);
  } else {
    console.log('\nعدد أحداث التقويم:', rows[0].count);
  }
});

db.all('SELECT id, title, date, startTime, endTime FROM AdminScheduleEntries LIMIT 5', (err, rows) => {
  if (err) {
    console.log('خطأ في قراءة أحداث التقويم:', err.message);
  } else {
    console.log('\nعينة من أحداث التقويم:');
    rows.forEach(row => {
      console.log(`- ${row.title} في ${row.date} من ${row.startTime} إلى ${row.endTime}`);
    });
  }
  
  db.close();
  console.log('\n=== انتهى الإصلاح ===');
});