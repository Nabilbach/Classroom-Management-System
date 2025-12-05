const sqlite3 = require('sqlite3').verbose();

console.log('📊 === فحص عدد قوالب الدروس ===\n');

const db = new sqlite3.Database('classroom.db');

// فحص العدد الإجمالي
db.all('SELECT COUNT(*) as count FROM LessonTemplates', (err, rows) => {
  if (err) {
    console.log('❌ خطأ في قراءة قوالب الدروس:', err.message);
  } else {
    console.log(`📚 العدد الإجمالي لقوالب الدروس: ${rows[0].count} قالب`);
  }
});

// عرض قائمة بجميع قوالب الدروس
db.all('SELECT id, title, weekNumber FROM LessonTemplates ORDER BY weekNumber', (err, rows) => {
  if (err) {
    console.log('❌ خطأ في قراءة تفاصيل القوالب:', err.message);
  } else {
    console.log('\n📋 قائمة جميع قوالب الدروس:');
    console.log('=' .repeat(60));
    
    rows.forEach((row, index) => {
      console.log(`${String(index + 1).padStart(2, '0')}. [${row.id}] الأسبوع ${row.weekNumber}: ${row.title}`);
    });
    
    console.log('=' .repeat(60));
    console.log(`📊 إجمالي القوالب المعروضة: ${rows.length}`);
  }
  
  db.close();
});