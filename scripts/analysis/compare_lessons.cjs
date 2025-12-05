const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🔍 مقارنة البيانات بين قاعدة البيانات الحالية والنسخة الاحتياطية\n');

function compareScheduledLessons() {
  return new Promise((resolve) => {
    const currentDb = new sqlite3.Database('classroom.db', sqlite3.OPEN_READONLY);
    const backupDb = new sqlite3.Database('classroom_backup_20250924_174347.db', sqlite3.OPEN_READONLY);
    
    // الحصول على الحصص من قاعدة البيانات الحالية
    currentDb.all(`SELECT * FROM ScheduledLessons ORDER BY createdAt`, (err, currentLessons) => {
      if (err) {
        console.log('❌ خطأ في قراءة الحصص الحالية:', err.message);
        resolve();
        return;
      }
      
      // الحصول على الحصص من النسخة الاحتياطية
      backupDb.all(`SELECT * FROM ScheduledLessons ORDER BY createdAt`, (err, backupLessons) => {
        if (err) {
          console.log('❌ خطأ في قراءة حصص النسخة الاحتياطية:', err.message);
          resolve();
          return;
        }
        
        console.log(`📊 الحصص في قاعدة البيانات الحالية: ${currentLessons.length}`);
        console.log(`📊 الحصص في النسخة الاحتياطية: ${backupLessons.length}`);
        console.log(`🔍 الحصص المفقودة: ${backupLessons.length - currentLessons.length}\n`);
        
        // العثور على الحصص المفقودة
        const currentIds = new Set(currentLessons.map(l => l.id));
        const missingLessons = backupLessons.filter(l => !currentIds.has(l.id));
        
        if (missingLessons.length > 0) {
          console.log('🚨 الحصص المفقودة من قاعدة البيانات الحالية:\n');
          
          missingLessons.forEach((lesson, index) => {
            const sections = lesson.assignedSections ? 
              (typeof lesson.assignedSections === 'string' ? 
                JSON.parse(lesson.assignedSections) : lesson.assignedSections) : [];
            
            console.log(`${index + 1}. ID: ${lesson.id}`);
            console.log(`   📅 التاريخ: ${lesson.date}`);
            console.log(`   ⏰ الوقت: ${lesson.startTime}`);
            console.log(`   📚 الموضوع: ${lesson.subject || lesson.customTitle || 'غير محدد'}`);
            console.log(`   🏫 الأقسام: ${Array.isArray(sections) ? sections.join(', ') : lesson.assignedSections}`);
            console.log(`   📝 الحالة: ${lesson.completionStatus}`);
            console.log(`   🕐 الإنشاء: ${lesson.createdAt}`);
            console.log(`   🔄 التحديث: ${lesson.updatedAt || 'غير محدد'}`);
            console.log('   ---\n');
          });
          
          // تجميع الحصص المفقودة حسب التاريخ
          const missingByDate = {};
          missingLessons.forEach(lesson => {
            if (!missingByDate[lesson.date]) {
              missingByDate[lesson.date] = [];
            }
            missingByDate[lesson.date].push(lesson);
          });
          
          console.log('📅 الحصص المفقودة مجمعة حسب التاريخ:');
          Object.keys(missingByDate).sort().forEach(date => {
            console.log(`\n📆 ${date}:`);
            missingByDate[date].forEach(lesson => {
              const sections = lesson.assignedSections ? 
                (typeof lesson.assignedSections === 'string' ? 
                  JSON.parse(lesson.assignedSections) : lesson.assignedSections) : [];
              console.log(`   - ${lesson.subject || lesson.customTitle} (${Array.isArray(sections) ? sections.join(', ') : lesson.assignedSections})`);
            });
          });
          
        } else {
          console.log('✅ لا توجد حصص مفقودة - جميع الحصص موجودة');
        }
        
        // التحقق من الحصص الجديدة في قاعدة البيانات الحالية
        const backupIds = new Set(backupLessons.map(l => l.id));
        const newLessons = currentLessons.filter(l => !backupIds.has(l.id));
        
        if (newLessons.length > 0) {
          console.log('\n🆕 حصص جديدة في قاعدة البيانات الحالية (غير موجودة في النسخة الاحتياطية):');
          newLessons.forEach((lesson, index) => {
            console.log(`${index + 1}. ID: ${lesson.id} - ${lesson.date} - ${lesson.subject || lesson.customTitle}`);
          });
        }
        
        currentDb.close();
        backupDb.close();
        resolve();
      });
    });
  });
}

compareScheduledLessons().catch(console.error);