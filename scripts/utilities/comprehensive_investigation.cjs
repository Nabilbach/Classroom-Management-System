const sqlite3 = require('sqlite3').verbose();

console.log('=== تحقيق شامل حول اختفاء البيانات ===');

const db = new sqlite3.Database('classroom.db');

// فحص جميع الجداول المهمة
const criticalTables = [
  'LessonTemplates',
  'Lessons', 
  'Attendance',
  'Students',
  'Sections',
  'AdminScheduleEntries'
];

let completedChecks = 0;

console.log('1. فحص عدد السجلات في الجداول المهمة:');

criticalTables.forEach(tableName => {
  db.all(`SELECT COUNT(*) as count FROM ${tableName}`, (err, rows) => {
    if (err) {
      console.log(`❌ خطأ في ${tableName}:`, err.message);
    } else {
      console.log(`📊 ${tableName}: ${rows[0].count} سجل`);
      
      if (tableName === 'Attendance' && rows[0].count === 0) {
        console.log('⚠️  تحذير: جدول الغياب فارغ تماماً!');
      }
      if (tableName === 'Lessons' && rows[0].count === 0) {
        console.log('⚠️  تحذير: جدول الدروس فارغ تماماً!');
      }
      if (tableName === 'LessonTemplates' && rows[0].count <= 1) {
        console.log('⚠️  تحذير: قوالب الدروس قليلة جداً!');
      }
    }
    
    completedChecks++;
    if (completedChecks === criticalTables.length) {
      console.log('\n2. فحص سجل التدقيق للبحث عن عمليات الحذف:');
      checkAuditLog();
    }
  });
});

function checkAuditLog() {
  db.all(`SELECT * FROM audit_log 
          WHERE action_type = 'DELETE' 
          AND (table_name = 'Attendance' OR table_name = 'Lessons' OR table_name = 'LessonTemplates')
          ORDER BY timestamp DESC LIMIT 20`, (err, rows) => {
    if (err) {
      console.log('❌ خطأ في قراءة سجل التدقيق:', err.message);
    } else {
      console.log(`📋 عمليات الحذف الأخيرة: ${rows.length}`);
      rows.forEach(row => {
        console.log(`🗑️  ${row.timestamp}: حذف من ${row.table_name} - السجل: ${row.record_id}`);
      });
    }
    
    console.log('\n3. فحص هيكل الجداول:');
    checkTableStructures();
  });
}

function checkTableStructures() {
  // فحص جدول الغياب
  db.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='Attendance'", (err, rows) => {
    if (err) {
      console.log('❌ خطأ في فحص هيكل Attendance:', err.message);
    } else if (rows.length === 0) {
      console.log('❌ جدول Attendance غير موجود!');
    } else {
      console.log('✅ جدول Attendance موجود');
    }
    
    // فحص جدول الدروس
    db.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='Lessons'", (err, rows) => {
      if (err) {
        console.log('❌ خطأ في فحص هيكل Lessons:', err.message);
      } else if (rows.length === 0) {
        console.log('❌ جدول Lessons غير موجود!');
      } else {
        console.log('✅ جدول Lessons موجود');
      }
      
      console.log('\n4. فحص النسخ الاحتياطية:');
      checkBackups();
    });
  });
}

function checkBackups() {
  const fs = require('fs');
  
  // فحص النسخة الاحتياطية التلقائية
  try {
    const backupFiles = fs.readdirSync('./auto_backups');
    console.log(`📁 النسخ الاحتياطية التلقائية: ${backupFiles.length}`);
    
    if (backupFiles.length > 0) {
      const latestBackup = backupFiles.sort().reverse()[0];
      console.log(`📄 أحدث نسخة: ${latestBackup}`);
      
      // فحص محتوى النسخة الاحتياطية
      const backupDb = new sqlite3.Database(`./auto_backups/${latestBackup}`);
      
      backupDb.all('SELECT COUNT(*) as count FROM Attendance', (err, rows) => {
        if (err) {
          console.log('❌ خطأ في قراءة Attendance من النسخة الاحتياطية:', err.message);
        } else {
          console.log(`📊 Attendance في النسخة الاحتياطية: ${rows[0].count}`);
        }
        
        backupDb.all('SELECT COUNT(*) as count FROM Lessons', (err, rows) => {
          if (err) {
            console.log('❌ خطأ في قراءة Lessons من النسخة الاحتياطية:', err.message);
          } else {
            console.log(`📊 Lessons في النسخة الاحتياطية: ${rows[0].count}`);
          }
          
          backupDb.all('SELECT COUNT(*) as count FROM LessonTemplates', (err, rows) => {
            if (err) {
              console.log('❌ خطأ في قراءة LessonTemplates من النسخة الاحتياطية:', err.message);
            } else {
              console.log(`📊 LessonTemplates في النسخة الاحتياطية: ${rows[0].count}`);
            }
            
            backupDb.close();
            
            console.log('\n5. التوصيات والإصلاحات:');
            generateRecommendations();
          });
        });
      });
    } else {
      console.log('❌ لا توجد نسخ احتياطية تلقائية');
      generateRecommendations();
    }
  } catch (e) {
    console.log('❌ خطأ في قراءة مجلد النسخ الاحتياطية:', e.message);
    generateRecommendations();
  }
}

function generateRecommendations() {
  console.log(`
📋 === ملخص التحقيق ===
1. الحالة الحالية للبيانات تم فحصها
2. سجل التدقيق تم تحليله
3. النسخ الاحتياطية تم فحصها
4. هيكل الجداول تم التحقق منه

🔧 === الإصلاحات المطلوبة ===
- إنشاء سجلات غياب تجريبية
- إنشاء دروس من المنهج
- تفعيل النسخ الاحتياطي التلقائي
- تقوية نظام الحماية

⚡ بدء تطبيق الإصلاحات...
`);
  
  db.close();
  
  // بدء عملية الإصلاح
  setTimeout(() => {
    console.log('🔄 جاري تطبيق الإصلاحات...');
    require('./emergency_data_restore.cjs');
  }, 1000);
}