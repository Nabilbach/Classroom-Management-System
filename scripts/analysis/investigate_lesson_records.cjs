const sqlite3 = require('sqlite3').verbose();

console.log('🔍 فحص سجلات الدروس (دفتر النصوص) للأيام المتأثرة\n');

function investigateLessonRecords() {
  return new Promise((resolve) => {
    const currentDb = new sqlite3.Database('classroom.db', sqlite3.OPEN_READONLY);
    const backupDb = new sqlite3.Database('classroom_backup_20250924_174347.db', sqlite3.OPEN_READONLY);
    
    console.log('1️⃣ فحص جداول الدروس المتاحة في قاعدة البيانات...');
    
    // فحص الجداول المتاحة
    currentDb.all(`SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%lesson%'`, (err, tables) => {
      if (err) {
        console.log('❌ خطأ في قراءة الجداول:', err.message);
        currentDb.close();
        backupDb.close();
        resolve();
        return;
      }
      
      console.log('📋 جداول الدروس الموجودة:');
      tables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.name}`);
      });
      
      if (tables.length === 0) {
        console.log('⚠️ لم يتم العثور على جداول الدروس');
        currentDb.close();
        backupDb.close();
        resolve();
        return;
      }
      
      // فحص جدول Lessons (الدروس الفعلية)
      console.log('\n2️⃣ فحص جدول Lessons (الدروس الفعلية - دفتر النصوص):');
      
      currentDb.all(`SELECT * FROM Lessons ORDER BY createdAt DESC`, (err, currentLessons) => {
        if (err) {
          console.log('❌ خطأ في قراءة جدول Lessons الحالي:', err.message);
        } else {
          console.log(`📊 الدروس في قاعدة البيانات الحالية: ${currentLessons ? currentLessons.length : 0}`);
          
          if (currentLessons && currentLessons.length > 0) {
            console.log('📋 عينة من الدروس الحالية:');
            currentLessons.slice(0, 5).forEach((lesson, index) => {
              console.log(`   ${index + 1}. تاريخ: ${lesson.date || 'غير محدد'} - موضوع: ${lesson.title || lesson.subject || 'غير محدد'}`);
            });
          } else {
            console.log('⚠️ لا توجد دروس في جدول Lessons');
          }
        }
        
        // فحص النسخة الاحتياطية
        backupDb.all(`SELECT * FROM Lessons ORDER BY createdAt DESC`, (err, backupLessons) => {
          if (err) {
            console.log('❌ خطأ في قراءة جدول Lessons من النسخة الاحتياطية:', err.message);
          } else {
            console.log(`📊 الدروس في النسخة الاحتياطية: ${backupLessons ? backupLessons.length : 0}`);
            
            if (backupLessons && backupLessons.length > 0) {
              console.log('📋 عينة من الدروس في النسخة الاحتياطية:');
              backupLessons.slice(0, 5).forEach((lesson, index) => {
                console.log(`   ${index + 1}. تاريخ: ${lesson.date || 'غير محدد'} - موضوع: ${lesson.title || lesson.subject || 'غير محدد'}`);
              });
              
              // البحث عن دروس للأيام المتأثرة
              const targetDates = ['2025-09-23', '2025-09-24'];
              console.log('\n🎯 البحث عن دروس الأيام المتأثرة في النسخة الاحتياطية:');
              
              targetDates.forEach(date => {
                const dateLessons = backupLessons.filter(l => l.date === date);
                console.log(`📅 ${date}: ${dateLessons.length} درس`);
                
                if (dateLessons.length > 0) {
                  dateLessons.forEach((lesson, index) => {
                    console.log(`   ${index + 1}. ID: ${lesson.id} - ${lesson.title || lesson.subject || 'بدون عنوان'}`);
                  });
                }
              });
            }
          }
          
          // فحص جدول LessonLogs (سجلات تنفيذ الدروس)
          console.log('\n3️⃣ فحص جدول LessonLogs (سجلات تنفيذ الدروس):');
          
          currentDb.all(`SELECT * FROM LessonLogs ORDER BY createdAt DESC`, (err, currentLogs) => {
            if (err) {
              console.log('❌ خطأ في قراءة جدول LessonLogs الحالي:', err.message);
            } else {
              console.log(`📊 سجلات تنفيذ الدروس الحالية: ${currentLogs ? currentLogs.length : 0}`);
              
              if (currentLogs && currentLogs.length > 0) {
                console.log('📋 عينة من سجلات التنفيذ:');
                currentLogs.slice(0, 3).forEach((log, index) => {
                  console.log(`   ${index + 1}. تاريخ: ${log.date || log.executionDate || 'غير محدد'}`);
                });
              }
            }
            
            backupDb.all(`SELECT * FROM LessonLogs ORDER BY createdAt DESC`, (err, backupLogs) => {
              if (err) {
                console.log('❌ خطأ في قراءة جدول LessonLogs من النسخة الاحتياطية:', err.message);
              } else {
                console.log(`📊 سجلات تنفيذ الدروس في النسخة الاحتياطية: ${backupLogs ? backupLogs.length : 0}`);
                
                if (backupLogs && backupLogs.length > 0) {
                  const targetDates = ['2025-09-23', '2025-09-24'];
                  console.log('\n🎯 البحث عن سجلات تنفيذ للأيام المتأثرة:');
                  
                  targetDates.forEach(date => {
                    const dateLogs = backupLogs.filter(l => l.date === date || l.executionDate === date);
                    console.log(`📅 ${date}: ${dateLogs.length} سجل تنفيذ`);
                    
                    if (dateLogs.length > 0) {
                      dateLogs.forEach((log, index) => {
                        console.log(`   ${index + 1}. ID: ${log.id} - درس: ${log.lessonId || 'غير محدد'}`);
                      });
                    }
                  });
                }
              }
              
              // فحص العلاقة مع ScheduledLessons
              console.log('\n4️⃣ مقارنة مع الحصص المجدولة:');
              
              currentDb.all(`
                SELECT 
                  date, 
                  COUNT(*) as scheduled_count,
                  GROUP_CONCAT(id) as lesson_ids
                FROM ScheduledLessons 
                WHERE date IN ('2025-09-23', '2025-09-24')
                GROUP BY date
                ORDER BY date
              `, (err, scheduledData) => {
                
                if (!err && scheduledData) {
                  console.log('📚 الحصص المجدولة للأيام المتأثرة:');
                  scheduledData.forEach(item => {
                    console.log(`📅 ${item.date}: ${item.scheduled_count} حصة مجدولة`);
                    console.log(`   IDs: ${item.lesson_ids}`);
                  });
                }
                
                // تحليل المشكلة
                console.log('\n5️⃣ تحليل المشكلة:');
                
                const currentLessonsCount = currentLessons ? currentLessons.length : 0;
                const backupLessonsCount = backupLessons ? backupLessons.length : 0;
                const currentLogsCount = currentLogs ? currentLogs.length : 0;
                const backupLogsCount = backupLogs ? backupLogs.length : 0;
                
                console.log('📊 مقارنة البيانات:');
                console.log(`📖 Lessons (دفتر النصوص):`);
                console.log(`   قاعدة البيانات الحالية: ${currentLessonsCount}`);
                console.log(`   النسخة الاحتياطية: ${backupLessonsCount}`);
                console.log(`   الفرق: ${backupLessonsCount - currentLessonsCount} درس مفقود`);
                
                console.log(`📝 LessonLogs (سجلات التنفيذ):`);
                console.log(`   قاعدة البيانات الحالية: ${currentLogsCount}`);
                console.log(`   النسخة الاحتياطية: ${backupLogsCount}`);
                console.log(`   الفرق: ${backupLogsCount - currentLogsCount} سجل مفقود`);
                
                if (backupLessonsCount > currentLessonsCount || backupLogsCount > currentLogsCount) {
                  console.log('\n🚨 تأكدت المشكلة: سجلات دفتر النصوص مفقودة!');
                  console.log('💡 نفس النمط: البيانات موجودة في النسخة الاحتياطية ومفقودة من قاعدة البيانات الحالية');
                } else {
                  console.log('\n✅ لا توجد دروس مفقودة من دفتر النصوص');
                }
                
                console.log('\n' + '='.repeat(70));
                console.log('🎯 النتيجة:');
                console.log('✅ الحصص المجدولة: ظاهرة في التقويم (ScheduledLessons)');
                
                if (backupLessonsCount > currentLessonsCount) {
                  console.log('🚨 دروس دفتر النصوص: مفقودة (Lessons)');
                  console.log('💡 هذا يفسر سبب ظهورها في التقويم واختفائها من دفتر النصوص');
                } else {
                  console.log('✅ دروس دفتر النصوص: سليمة');
                }
                
                currentDb.close();
                backupDb.close();
                resolve();
              });
            });
          });
        });
      });
    });
  });
}

investigateLessonRecords().catch(console.error);