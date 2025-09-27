const sqlite3 = require('sqlite3').verbose();

// التحقق من النسخة الاحتياطية الأصلية  
const backupPath = '../classroom_backup_20250924_174347.db';

console.log('🔍 التحقق من النسخة الاحتياطية الأصلية...\n');

const db = new sqlite3.Database(backupPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('❌ خطأ في فتح النسخة الاحتياطية:', err.message);
    process.exit(1);
  }
});

// التحقق من سجلات الحضور في النسخة الاحتياطية
db.all(`SELECT COUNT(*) as total FROM Attendances`, (err, rows) => {
  if (err) {
    console.error('❌ خطأ في الاستعلام:', err.message);
    return;
  }
  
  console.log(`📊 إجمالي سجلات الحضور في النسخة الاحتياطية: ${rows[0].total}`);
  
  // التحقق من التواريخ
  db.all(`SELECT DISTINCT date FROM Attendances ORDER BY date`, (err, dates) => {
    if (err) {
      console.error('❌ خطأ في استعلام التواريخ:', err.message);
      return;
    }
    
    console.log(`📅 عدد الأيام في النسخة الاحتياطية: ${dates.length}`);
    console.log('التواريخ:');
    dates.forEach(record => {
      console.log(`   - ${record.date}`);
    });
    
    // التحقق من الأقسام
    db.all(`SELECT DISTINCT sectionId, COUNT(*) as count FROM Attendances GROUP BY sectionId`, (err, sections) => {
      if (err) {
        console.error('❌ خطأ في استعلام الأقسام:', err.message);
        return;
      }
      
      console.log(`\n🏫 عدد الأقسام في النسخة الاحتياطية: ${sections.length}`);
      console.log('الأقسام:');
      sections.forEach(section => {
        console.log(`   - ${section.sectionId}: ${section.count} سجلات`);
      });
      
      // التحقق من آخر 10 سجلات
      db.all(`SELECT * FROM Attendances ORDER BY createdAt DESC LIMIT 10`, (err, records) => {
        if (err) {
          console.error('❌ خطأ في استعلام السجلات:', err.message);
          return;
        }
        
        console.log('\n📋 آخر 10 سجلات في النسخة الاحتياطية:');
        records.forEach((record, i) => {
          console.log(`   ${i+1}. Student ${record.studentId} - ${record.date} - ${record.isPresent ? 'حاضر' : 'غائب'} - ${record.sectionId} (${record.createdAt})`);
        });
        
        db.close();
        console.log('\n✅ انتهاء التحقق من النسخة الاحتياطية');
      });
    });
  });
});