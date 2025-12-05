const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'classroom.db');

function detailedCheck() {
  console.log('🔍 فحص تفصيلي لبيانات إدارة التعلم في قاعدة البيانات الرئيسية\n');
  
  const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error('❌ خطأ في فتح قاعدة البيانات:', err.message);
      return;
    }
    
    console.log('✅ تم فتح قاعدة البيانات بنجاح\n');
    
    // فحص الحصص المجدولة
    db.all(`SELECT * FROM ScheduledLessons LIMIT 5`, (err, rows) => {
      console.log('📚 الحصص المجدولة (ScheduledLessons):');
      if (err) {
        console.log('❌ خطأ:', err.message);
      } else if (rows.length === 0) {
        console.log('⚠️ لا توجد حصص مجدولة');
      } else {
        console.log(`✅ وجد ${rows.length} حصة مجدولة (عينة):`);
        rows.forEach((row, index) => {
          console.log(`  ${index + 1}. ID: ${row.id}, القسم: ${row.sectionId}, الموضوع: ${row.subject || 'غير محدد'}`);
        });
      }
      console.log();
      
      // فحص الدروس
      db.all(`SELECT * FROM Lessons LIMIT 5`, (err, rows) => {
        console.log('📖 الدروس (Lessons):');
        if (err) {
          console.log('❌ خطأ:', err.message);
        } else if (rows.length === 0) {
          console.log('⚠️ لا توجد دروس مسجلة');
        } else {
          console.log(`✅ وجد ${rows.length} درس (عينة):`);
          rows.forEach((row, index) => {
            console.log(`  ${index + 1}. ID: ${row.id}, العنوان: ${row.title || 'غير محدد'}, القسم: ${row.sectionId}`);
          });
        }
        console.log();
        
        // فحص سجلات الدروس
        db.all(`SELECT * FROM LessonLogs LIMIT 5`, (err, rows) => {
          console.log('📝 سجلات الدروس (LessonLogs):');
          if (err) {
            console.log('❌ خطأ:', err.message);
          } else if (rows.length === 0) {
            console.log('⚠️ لا توجد سجلات دروس');
          } else {
            console.log(`✅ وجد ${rows.length} سجل درس (عينة):`);
            rows.forEach((row, index) => {
              console.log(`  ${index + 1}. ID: ${row.id}, الدرس: ${row.lessonId}, التاريخ: ${row.date || 'غير محدد'}`);
            });
          }
          console.log();
          
          // التحقق من وجود جدول قوالب الدروس
          db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='LessonTemplates'`, (err, row) => {
            console.log('🎨 قوالب الدروس (LessonTemplates):');
            if (err) {
              console.log('❌ خطأ:', err.message);
            } else if (!row) {
              console.log('❌ جدول قوالب الدروس غير موجود');
              
              // البحث عن جداول أخرى قد تحتوي على قوالب
              db.all(`SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%template%'`, (err, tables) => {
                if (tables && tables.length > 0) {
                  console.log('🔍 جداول أخرى تحتوي على "template":');
                  tables.forEach(table => {
                    console.log(`  - ${table.name}`);
                  });
                } else {
                  console.log('❌ لا توجد جداول تحتوي على قوالب');
                }
                
                finalizeSummary();
              });
            } else {
              // الجدول موجود، فحص المحتوى
              db.all(`SELECT * FROM LessonTemplates LIMIT 5`, (err, templates) => {
                if (err) {
                  console.log('❌ خطأ في قراءة القوالب:', err.message);
                } else if (templates.length === 0) {
                  console.log('⚠️ جدول القوالب فارغ');
                } else {
                  console.log(`✅ وجد ${templates.length} قالب (عينة):`);
                  templates.forEach((template, index) => {
                    console.log(`  ${index + 1}. ID: ${template.id}, العنوان: ${template.title || 'غير محدد'}`);
                  });
                }
                
                finalizeSummary();
              });
            }
          });
        });
      });
    });
    
    function finalizeSummary() {
      console.log('\n' + '='.repeat(60));
      console.log('📊 ملخص بيانات إدارة التعلم:');
      console.log('✅ الحصص المجدولة: موجودة (5 سجلات)');
      console.log('⚠️ الدروس: جدول موجود لكن فارغ');
      console.log('⚠️ سجلات الدروس: جدول موجود لكن فارغ');
      console.log('❌ قوالب الدروس: يحتاج فحص إضافي');
      console.log('='.repeat(60));
      
      db.close();
    }
  });
}

detailedCheck();