const sqlite3 = require('sqlite3');
const path = require('path');

const backupPath = path.resolve(__dirname, '..', 'classroom_backup_emergency_20250926_155209.db');
const db = new sqlite3.Database(backupPath);

console.log('🔍 فحص جدول Attendances في النسخة الاحتياطية الطارئة...');

db.all("SELECT COUNT(*) as count FROM Attendances WHERE date IN ('2025-09-25', '2025-09-26')", (err, rows) => {
  if (err) {
    console.error('خطأ:', err);
    db.close();
    return;
  }
  
  console.log('عدد السجلات للتواريخ 25-26:', rows[0].count);
  
  if (rows[0].count > 0) {
    db.all("SELECT studentId, sectionId, date, isPresent FROM Attendances WHERE date IN ('2025-09-25', '2025-09-26') ORDER BY date, studentId", (err2, records) => {
      if (err2) {
        console.error('خطأ 2:', err2);
        db.close();
        return;
      }
      
      console.log('\nالسجلات الموجودة:');
      records.forEach(r => {
        console.log(`- studentId=${r.studentId}, sectionId=${r.sectionId}, date=${r.date}, present=${r.isPresent}`);
      });
      
      console.log(`\nإجمالي الطلاب المختلفين: ${new Set(records.map(r => r.studentId)).size}`);
      
      db.close();
    });
  } else {
    console.log('❌ لا توجد سجلات للتواريخ المطلوبة في هذه النسخة الاحتياطية');
    db.close();
  }
});