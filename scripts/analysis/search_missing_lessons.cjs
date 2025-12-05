const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log('🔍 البحث الشامل عن الحصص المجدولة المفقودة\n');
console.log('='.repeat(70));

// قواعد البيانات المحتملة
const databases = [
  { name: 'Production', path: path.resolve(__dirname, 'classroom.db') },
  { name: 'Development', path: path.resolve(__dirname, 'classroom_dev.db') },
  { name: 'Backup', path: path.resolve(__dirname, 'classroom_backup.db') },
  { name: 'Backup2', path: path.resolve(__dirname, 'classroom_backup_2.db') },
  { name: 'BackupDB', path: path.resolve(__dirname, 'classroom.db.db') }
];

async function searchInDatabase(dbInfo) {
  return new Promise((resolve) => {
    console.log(`\n📂 فحص قاعدة البيانات: ${dbInfo.name}`);
    
    if (!fs.existsSync(dbInfo.path)) {
      console.log('❌ الملف غير موجود');
      resolve({ name: dbInfo.name, error: 'File not found' });
      return;
    }
    
    const db = new sqlite3.Database(dbInfo.path, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.log(`❌ لا يمكن فتح القاعدة: ${err.message}`);
        resolve({ name: dbInfo.name, error: err.message });
        return;
      }
      
      console.log('✅ تم فتح القاعدة بنجاح');
      
      // البحث في جدول ScheduledLessons
      db.all(`SELECT * FROM ScheduledLessons ORDER BY date DESC`, (err, lessons) => {
        if (err) {
          console.log('❌ خطأ في قراءة ScheduledLessons:', err.message);
          resolve({ name: dbInfo.name, lessons: [] });
          return;
        }
        
        console.log(`📊 وجد ${lessons ? lessons.length : 0} حصة مجدولة`);
        
        if (lessons && lessons.length > 0) {
          console.log('📋 تفاصيل الحصص:');
          lessons.forEach((lesson, index) => {
            const sections = lesson.assignedSections ? 
              (typeof lesson.assignedSections === 'string' ? 
                JSON.parse(lesson.assignedSections) : lesson.assignedSections) : [];
            
            console.log(`  ${index + 1}. ID: ${lesson.id}`);
            console.log(`     📅 التاريخ: ${lesson.date}`);
            console.log(`     ⏰ الوقت: ${lesson.startTime || 'غير محدد'}`);
            console.log(`     📚 الموضوع: ${lesson.subject || lesson.customTitle || 'غير محدد'}`);
            console.log(`     🏫 الأقسام: ${Array.isArray(sections) ? sections.join(', ') : 'غير محدد'}`);
            console.log(`     📝 الحالة: ${lesson.completionStatus || 'غير محدد'}`);
            console.log(`     🕐 الإنشاء: ${lesson.createdAt || 'غير محدد'}`);
            console.log('     ---');
          });
        }
        
        db.close();
        resolve({ name: dbInfo.name, lessons: lessons || [] });
      });
    });
  });
}

// البحث في ملفات JSON
function searchInJSONFiles() {
  console.log('\n📁 البحث في ملفات JSON:');
  
  const jsonFiles = [
    'backend/lessons.json',
    'backend/lessonLogs.json',
    'public/data/lessonLogs.json',
    'scheduled_lessons.json',  // ملف محتمل
    'lessons_backup.json'      // ملف محتمل
  ];
  
  jsonFiles.forEach(filePath => {
    const fullPath = path.resolve(__dirname, filePath);
    console.log(`\n📄 فحص ${filePath}:`);
    
    try {
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        if (content.trim()) {
          const data = JSON.parse(content);
          
          if (Array.isArray(data)) {
            console.log(`✅ يحتوي على ${data.length} عنصر`);
            
            // البحث عن حصص مجدولة
            const scheduledLessons = data.filter(item => 
              item.date || item.startTime || item.subject || item.assignedSections
            );
            
            if (scheduledLessons.length > 0) {
              console.log(`🎯 وجد ${scheduledLessons.length} حصة محتملة:`);
              scheduledLessons.slice(0, 3).forEach((lesson, index) => {
                console.log(`   ${index + 1}. ${JSON.stringify(lesson).substring(0, 80)}...`);
              });
            }
          } else {
            console.log(`✅ ملف كائن بمفاتيح: ${Object.keys(data).join(', ')}`);
          }
        } else {
          console.log('⚠️ الملف فارغ');
        }
      } else {
        console.log('❌ الملف غير موجود');
      }
    } catch (error) {
      console.log(`❌ خطأ: ${error.message}`);
    }
  });
}

// البحث في localStorage (عبر ملفات محتملة)
function searchInLocalStorage() {
  console.log('\n💾 البحث في ملفات التخزين المحلي المحتملة:');
  
  // البحث في المجلدات عن ملفات قد تحتوي على بيانات محلية
  const searchDirs = ['.', 'backend', 'src', 'public'];
  
  searchDirs.forEach(dir => {
    try {
      const files = fs.readdirSync(dir);
      const relevantFiles = files.filter(file => 
        file.includes('lesson') || 
        file.includes('schedule') || 
        file.includes('backup') ||
        file.includes('temp')
      );
      
      if (relevantFiles.length > 0) {
        console.log(`📂 في مجلد ${dir}:`);
        relevantFiles.forEach(file => {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          console.log(`   📄 ${file} (${(stats.size / 1024).toFixed(1)} KB) - ${stats.mtime.toLocaleDateString()}`);
        });
      }
    } catch (error) {
      // تجاهل الأخطاء
    }
  });
}

async function runFullSearch() {
  console.log('🔍 بدء البحث الشامل عن الحصص المفقودة...\n');
  
  let totalLessonsFound = 0;
  let allLessons = [];
  
  // البحث في قواعد البيانات
  for (const dbInfo of databases) {
    const result = await searchInDatabase(dbInfo);
    if (result.lessons) {
      totalLessonsFound += result.lessons.length;
      allLessons = allLessons.concat(result.lessons.map(l => ({...l, source: result.name})));
    }
  }
  
  // البحث في ملفات JSON
  searchInJSONFiles();
  
  // البحث في ملفات التخزين المحلي
  searchInLocalStorage();
  
  // تقرير نهائي
  console.log('\n' + '='.repeat(70));
  console.log('📊 تقرير البحث النهائي:');
  console.log(`🔢 إجمالي الحصص الموجودة: ${totalLessonsFound}`);
  
  if (allLessons.length > 0) {
    console.log('\n📅 جميع الحصص الموجودة مرتبة بالتاريخ:');
    allLessons.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    
    allLessons.forEach((lesson, index) => {
      console.log(`${index + 1}. [${lesson.source}] ${lesson.date} - ${lesson.subject || lesson.customTitle || 'بدون عنوان'}`);
    });
    
    // تحليل التواريخ
    const dates = allLessons.map(l => l.date).filter(d => d);
    if (dates.length > 0) {
      console.log(`\n📊 نطاق التواريخ: من ${Math.min(...dates.map(d => new Date(d)))} إلى ${Math.max(...dates.map(d => new Date(d)))}`);
    }
  } else {
    console.log('\n⚠️ لم يتم العثور على حصص في أي مكان!');
  }
  
  console.log('='.repeat(70));
}

runFullSearch().catch(console.error);