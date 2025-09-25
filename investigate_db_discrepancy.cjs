const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

console.log('🔍 === فحص جميع قواعد البيانات الموجودة ===\n');

// قائمة جميع ملفات قاعدة البيانات
const dbFiles = [
  'classroom.db',
  'classroom_dev.db', 
  'classroom_backup.db.db',
  'classroom_backup_2.db',
  'classroom_backup_20250924_174347.db'
];

let completedChecks = 0;

dbFiles.forEach(dbFile => {
  if (fs.existsSync(dbFile)) {
    console.log(`📁 فحص: ${dbFile}`);
    
    const db = new sqlite3.Database(dbFile);
    
    db.all('SELECT COUNT(*) as count FROM LessonTemplates', (err, rows) => {
      if (err) {
        console.log(`❌ خطأ في ${dbFile}:`, err.message);
      } else {
        console.log(`📚 ${dbFile}: ${rows[0].count} قالب درس`);
        
        // إذا كان العدد كبير، اعرض عينة
        if (rows[0].count > 30) {
          console.log(`⚠️  هذا العدد مرتفع! دعني أفحص التفاصيل...`);
          
          db.all('SELECT COUNT(DISTINCT title) as unique_count FROM LessonTemplates', (err, uniqueRows) => {
            if (!err) {
              console.log(`📊 العناوين المختلفة في ${dbFile}: ${uniqueRows[0].unique_count}`);
            }
          });
          
          db.all('SELECT title, COUNT(*) as count FROM LessonTemplates GROUP BY title HAVING COUNT(*) > 1 LIMIT 5', (err, duplicates) => {
            if (!err && duplicates.length > 0) {
              console.log(`🔄 قوالب مكررة في ${dbFile}:`);
              duplicates.forEach(dup => {
                console.log(`   - "${dup.title}" مكررة ${dup.count} مرات`);
              });
            }
          });
        }
      }
      
      db.close();
      completedChecks++;
      
      if (completedChecks === dbFiles.length) {
        console.log('\n📋 === ملخص الفحص ===');
        console.log('تم فحص جميع ملفات قاعدة البيانات');
        console.log('الآن دعني أتحقق من أي قاعدة بيانات يستخدمها النظام...');
        
        setTimeout(() => checkSystemConfig(), 1000);
      }
    });
  } else {
    console.log(`⚠️  ${dbFile} غير موجود`);
    completedChecks++;
  }
});

function checkSystemConfig() {
  console.log('\n🔧 فحص إعدادات النظام...');
  
  // فحص ملف backend/index.js لمعرفة أي قاعدة بيانات يستخدمها
  if (fs.existsSync('backend/index.js')) {
    const backendContent = fs.readFileSync('backend/index.js', 'utf8');
    
    console.log('📄 فحص backend/index.js...');
    
    // البحث عن أسماء قواعد البيانات
    const dbMatches = backendContent.match(/[\w-]+\.db/g);
    if (dbMatches) {
      console.log('🔍 قواعد البيانات المذكورة في الكود:');
      [...new Set(dbMatches)].forEach(db => {
        console.log(`   - ${db}`);
      });
    }
    
    // البحث عن متغيرات البيئة
    if (backendContent.includes('NODE_ENV') || backendContent.includes('process.env')) {
      console.log('⚙️  النظام يستخدم متغيرات البيئة - قد يكون في بيئة التطوير');
    }
  }
  
  // فحص ملفات البيئة
  const envFiles = ['.env', '.env.development', '.env.production'];
  envFiles.forEach(envFile => {
    if (fs.existsSync(envFile)) {
      console.log(`📋 وجدت ملف البيئة: ${envFile}`);
      try {
        const envContent = fs.readFileSync(envFile, 'utf8');
        if (envContent.includes('DB') || envContent.includes('DATABASE')) {
          console.log(`   يحتوي على إعدادات قاعدة البيانات`);
        }
      } catch (e) {
        console.log(`   خطأ في قراءة ${envFile}`);
      }
    }
  });
  
  console.log('\n💡 التوصية: يبدو أن هناك قاعدة بيانات مختلفة تحتوي على 68 قالب.');
  console.log('🔍 دعني أبحث عن القاعدة الصحيحة...');
}