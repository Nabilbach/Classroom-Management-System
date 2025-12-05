const sqlite3 = require('sqlite3').verbose();

console.log('=== فحص هيكل جداول النظام ===');

const db = new sqlite3.Database('classroom.db');

// فحص جدول AdminScheduleEntries
db.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='AdminScheduleEntries'", (err, rows) => {
  if (err) {
    console.log('خطأ في قراءة هيكل AdminScheduleEntries:', err.message);
  } else {
    console.log('\nهيكل جدول AdminScheduleEntries:');
    if (rows.length > 0) {
      console.log(rows[0].sql);
    } else {
      console.log('جدول AdminScheduleEntries غير موجود!');
    }
  }
  
  // قراءة عينة من البيانات
  db.all('SELECT * FROM AdminScheduleEntries LIMIT 3', (err, rows) => {
    if (err) {
      console.log('خطأ في قراءة عينة AdminScheduleEntries:', err.message);
    } else {
      console.log('\nعينة من بيانات AdminScheduleEntries:');
      rows.forEach((row, index) => {
        console.log(`\nالسجل ${index + 1}:`);
        Object.keys(row).forEach(key => {
          console.log(`  ${key}: ${row[key]}`);
        });
      });
    }
    
    // الآن فحص جدول LessonTemplates بتفصيل أكثر
    db.all('SELECT * FROM LessonTemplates', (err, rows) => {
      if (err) {
        console.log('خطأ في قراءة LessonTemplates:', err.message);
      } else {
        console.log(`\n=== جميع قوالب الدروس (${rows.length}) ===`);
        rows.forEach((row, index) => {
          console.log(`\nقالب ${index + 1}:`);
          console.log(`  ID: ${row.id}`);
          console.log(`  العنوان: ${row.title}`);
          console.log(`  المادة: ${row.subject}`);
          console.log(`  المستوى: ${row.grade || row.level}`);
          console.log(`  المدة: ${row.duration} دقيقة`);
          if (row.objectives) console.log(`  الأهداف: ${row.objectives.substring(0, 100)}...`);
        });
      }
      
      db.close();
      console.log('\n=== انتهى الفحص التفصيلي ===');
    });
  });
});