const sqlite3 = require('sqlite3').verbose();

console.log('=== فحص النسخة الاحتياطية التلقائية ===');

const backupDb = new sqlite3.Database('./auto_backups/auto_backup_2025-09-24T23-10-57-110Z.db');

// فحص قوالب الدروس في النسخة الاحتياطية
backupDb.all('SELECT COUNT(*) as count FROM LessonTemplates', (err, rows) => {
  if (err) {
    console.log('خطأ في قراءة النسخة الاحتياطية:', err.message);
  } else {
    console.log('عدد قوالب الدروس في النسخة الاحتياطية:', rows[0].count);
  }
});

backupDb.all('SELECT id, title, subject, grade FROM LessonTemplates', (err, rows) => {
  if (err) {
    console.log('خطأ في قراءة تفاصيل قوالب الدروس:', err.message);
  } else {
    console.log('\nقوالب الدروس في النسخة الاحتياطية:');
    rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.title} (${row.subject} - ${row.grade})`);
    });
  }
  
  backupDb.close();
  
  // الآن سأقوم بعملية الاستعادة
  console.log('\n=== بدء عملية الاستعادة ===');
  performRestore();
});

function performRestore() {
  const currentDb = new sqlite3.Database('classroom.db');
  const backupDb = new sqlite3.Database('./auto_backups/auto_backup_2025-09-24T23-10-57-110Z.db');
  
  // حذف جميع قوالب الدروس الحالية
  currentDb.run('DELETE FROM LessonTemplates', (err) => {
    if (err) {
      console.log('خطأ في حذف قوالب الدروس الحالية:', err.message);
      return;
    }
    
    console.log('تم حذف قوالب الدروس الحالية');
    
    // نسخ البيانات من النسخة الاحتياطية
    backupDb.all('SELECT * FROM LessonTemplates', (err, rows) => {
      if (err) {
        console.log('خطأ في قراءة البيانات من النسخة الاحتياطية:', err.message);
        return;
      }
      
      let insertCount = 0;
      const insertStmt = currentDb.prepare(`
        INSERT INTO LessonTemplates (
          id, title, subject, grade, duration, objectives, content, 
          stages, resources, assessment, homework, notes, createdAt, 
          updatedAt, description, estimatedSessions, courseName, 
          level, weekNumber, scheduledSections
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      rows.forEach(row => {
        insertStmt.run([
          row.id, row.title, row.subject, row.grade, row.duration,
          row.objectives, row.content, row.stages, row.resources,
          row.assessment, row.homework, row.notes, row.createdAt,
          row.updatedAt, row.description, row.estimatedSessions,
          row.courseName, row.level, row.weekNumber, row.scheduledSections
        ], (err) => {
          if (err) {
            console.log(`خطأ في إدراج ${row.title}:`, err.message);
          } else {
            insertCount++;
            console.log(`تم استعادة: ${row.title}`);
          }
          
          if (insertCount === rows.length) {
            insertStmt.finalize();
            console.log(`\n=== تمت الاستعادة بنجاح: ${insertCount} قالب ===`);
            
            // فحص النتيجة
            currentDb.all('SELECT COUNT(*) as count FROM LessonTemplates', (err, countRows) => {
              if (err) {
                console.log('خطأ في فحص النتيجة:', err.message);
              } else {
                console.log('عدد قوالب الدروس بعد الاستعادة:', countRows[0].count);
              }
              
              currentDb.close();
              backupDb.close();
              console.log('=== انتهت عملية الاستعادة ===');
            });
          }
        });
      });
      
      if (rows.length === 0) {
        console.log('النسخة الاحتياطية فارغة أيضاً!');
        currentDb.close();
        backupDb.close();
      }
    });
  });
}