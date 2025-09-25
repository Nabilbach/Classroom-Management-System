const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log('🔍 فحص ملف النسخة الاحتياطية المؤرخة\n');

const backupDbPath = 'classroom_backup_20250924_174347.db';

if (!fs.existsSync(backupDbPath)) {
  console.log('❌ ملف النسخة الاحتياطية غير موجود');
  process.exit(1);
}

const db = new sqlite3.Database(backupDbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.log('❌ خطأ في فتح قاعدة البيانات:', err.message);
    return;
  }
  
  console.log('✅ تم فتح النسخة الاحتياطية بنجاح');
  
  // فحص جدول ScheduledLessons
  db.all(`SELECT name FROM sqlite_master WHERE type='table'`, (err, tables) => {
    if (err) {
      console.log('❌ خطأ في قراءة الجداول:', err.message);
      return;
    }
    
    console.log('📋 الجداول الموجودة:');
    tables.forEach(table => {
      console.log(`   - ${table.name}`);
    });
    
    // التحقق من وجود جدول ScheduledLessons
    const hasScheduledLessons = tables.some(t => t.name === 'ScheduledLessons');
    
    if (!hasScheduledLessons) {
      console.log('\n❌ جدول ScheduledLessons غير موجود في هذه النسخة الاحتياطية');
      db.close();
      return;
    }
    
    console.log('\n✅ جدول ScheduledLessons موجود');
    
    // عد الحصص
    db.get(`SELECT COUNT(*) as count FROM ScheduledLessons`, (err, result) => {
      if (err) {
        console.log('❌ خطأ في عد الحصص:', err.message);
        db.close();
        return;
      }
      
      console.log(`📊 عدد الحصص في النسخة الاحتياطية: ${result.count}`);
      
      if (result.count > 0) {
        // عرض تفاصيل الحصص
        db.all(`SELECT * FROM ScheduledLessons ORDER BY createdAt DESC`, (err, lessons) => {
          if (err) {
            console.log('❌ خطأ في قراءة الحصص:', err.message);
          } else {
            console.log('\n📋 الحصص في النسخة الاحتياطية:');
            lessons.forEach((lesson, index) => {
              console.log(`\n${index + 1}. ID: ${lesson.id}`);
              console.log(`   📅 التاريخ: ${lesson.date}`);
              console.log(`   ⏰ الوقت: ${lesson.startTime}`);
              console.log(`   📚 الموضوع: ${lesson.subject || lesson.customTitle || 'غير محدد'}`);
              console.log(`   🏫 الأقسام: ${lesson.assignedSections}`);
              console.log(`   📝 الحالة: ${lesson.completionStatus}`);
              console.log(`   🕐 الإنشاء: ${lesson.createdAt}`);
              console.log(`   🔄 التحديث: ${lesson.updatedAt || 'غير محدد'}`);
            });
          }
          db.close();
        });
      } else {
        console.log('\n⚠️ النسخة الاحتياطية فارغة من الحصص أيضاً');
        db.close();
      }
    });
  });
});