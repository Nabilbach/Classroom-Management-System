const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// قواعد البيانات المحتملة
const databases = [
  { name: 'Production', path: path.resolve(__dirname, 'classroom.db') },
  { name: 'Development', path: path.resolve(__dirname, 'classroom_dev.db') },
  { name: 'Backup', path: path.resolve(__dirname, 'classroom_backup.db') },
  { name: 'Backup2', path: path.resolve(__dirname, 'classroom_backup_2.db') }
];

async function checkDatabase(dbInfo) {
  return new Promise((resolve) => {
    console.log(`\n🔍 فحص قاعدة البيانات: ${dbInfo.name} (${dbInfo.path})`);
    
    const db = new sqlite3.Database(dbInfo.path, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.log(`❌ لا يمكن فتح ${dbInfo.name}: ${err.message}`);
        resolve({ name: dbInfo.name, error: err.message });
        return;
      }
      
      console.log(`✅ تم فتح ${dbInfo.name} بنجاح`);
      
      const results = { name: dbInfo.name, tables: {} };
      
      // فحص الجداول المهمة
      const tablesToCheck = [
        'Lessons',
        'LessonLogs', 
        'LessonTemplates',
        'ScheduledLessons',
        'Sections',
        'Students',
        'Attendances'
      ];
      
      let completed = 0;
      
      tablesToCheck.forEach(table => {
        db.get(`SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?`, [table], (err, row) => {
          if (err || !row || row.count === 0) {
            results.tables[table] = { exists: false, count: 0 };
          } else {
            // الجدول موجود، احسب عدد السجلات
            db.get(`SELECT COUNT(*) as count FROM ${table}`, (err, countRow) => {
              results.tables[table] = {
                exists: true,
                count: err ? 0 : countRow.count
              };
              
              completed++;
              if (completed === tablesToCheck.length) {
                db.close();
                resolve(results);
              }
            });
            return;
          }
          
          completed++;
          if (completed === tablesToCheck.length) {
            db.close();
            resolve(results);
          }
        });
      });
    });
  });
}

async function checkAllDatabases() {
  console.log('📊 فحص شامل لبيانات إدارة التعلم في جميع قواعد البيانات\n');
  console.log('='.repeat(70));
  
  for (const dbInfo of databases) {
    const result = await checkDatabase(dbInfo);
    
    if (result.error) {
      continue;
    }
    
    console.log(`\n📋 تقرير ${result.name}:`);
    console.log('-'.repeat(40));
    
    let hasLearningData = false;
    
    Object.entries(result.tables).forEach(([table, info]) => {
      const status = info.exists ? '✅' : '❌';
      const count = info.exists ? `(${info.count} سجل)` : '(غير موجود)';
      console.log(`${status} ${table}: ${count}`);
      
      if (info.exists && info.count > 0 && ['Lessons', 'LessonLogs', 'LessonTemplates', 'ScheduledLessons'].includes(table)) {
        hasLearningData = true;
      }
    });
    
    console.log(`\n🎯 حالة بيانات التعلم: ${hasLearningData ? '✅ موجودة' : '❌ غير موجودة'}`);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('انتهى الفحص');
}

checkAllDatabases().catch(console.error);