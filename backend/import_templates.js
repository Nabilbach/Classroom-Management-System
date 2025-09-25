const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'classroom.db');
const db = new sqlite3.Database(dbPath);

console.log('📥 أداة استيراد قوالب الدروس');
console.log('=====================================');

// التحقق من إعداد النظام
const checkSetup = () => {
  return new Promise((resolve, reject) => {
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='LessonTemplates'", (err, row) => {
      if (err) {
        reject(new Error(`خطأ في التحقق من الجدول: ${err.message}`));
      } else if (!row) {
        reject(new Error('جدول LessonTemplates غير موجود. يرجى تشغيل create_lesson_templates_table.js أولاً'));
      } else {
        console.log('✅ جدول LessonTemplates جاهز');
        resolve();
      }
    });
  });
};

// استيراد من ملف JSON
const importFromFile = (filePath) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      reject(new Error(`الملف غير موجود: ${filePath}`));
      return;
    }

    try {
      const data = fs.readFileSync(filePath, 'utf8');
      const templates = JSON.parse(data);
      
      if (!Array.isArray(templates)) {
        reject(new Error('ملف JSON يجب أن يحتوي على مصفوفة من القوالب'));
        return;
      }

      console.log(`📚 تم العثور على ${templates.length} قالب في الملف`);
      
      let imported = 0;
      let errors = [];
      
      const importNext = (index) => {
        if (index >= templates.length) {
          resolve({ imported, total: templates.length, errors });
          return;
        }
        
        const template = templates[index];
        
        // التحقق من البيانات المطلوبة
        if (!template.title || !template.subject || !template.grade) {
          errors.push(`القالب ${index + 1}: مفقود العنوان أو المادة أو الصف`);
          importNext(index + 1);
          return;
        }
        
        // إنشاء معرف فريد إذا لم يكن موجوداً
        const id = template.id || `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        
        // تحويل البيانات للتوافق
        const stages = JSON.stringify(template.stages || []);
        const objectives = JSON.stringify(template.objectives || []);
        const resources = JSON.stringify(template.resources || []);
        const assessment = JSON.stringify(template.assessment || {});
        const homework = JSON.stringify(template.homework || {});
        
        db.run(`
          INSERT OR REPLACE INTO LessonTemplates (
            id, title, subject, grade, duration, objectives, content, 
            stages, resources, assessment, homework, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id,
          template.title,
          template.subject || template.courseName,
          template.grade || template.level,
          template.duration || (template.estimatedSessions ? template.estimatedSessions * 50 : 50),
          objectives,
          template.content || template.description || '',
          stages,
          resources,
          assessment,
          homework,
          template.notes || ''
        ], function(err) {
          if (err) {
            errors.push(`القالب "${template.title}": ${err.message}`);
          } else {
            imported++;
            console.log(`✅ ${imported}/${templates.length} - ${template.title}`);
          }
          
          importNext(index + 1);
        });
      };
      
      importNext(0);
      
    } catch (error) {
      reject(new Error(`خطأ في قراءة الملف: ${error.message}`));
    }
  });
};

// استيراد من localStorage (نص JSON)
const importFromLocalStorage = (jsonText) => {
  return new Promise((resolve, reject) => {
    try {
      const templates = JSON.parse(jsonText);
      
      if (!Array.isArray(templates)) {
        reject(new Error('البيانات يجب أن تكون مصفوفة من القوالب'));
        return;
      }

      console.log(`📚 تم العثور على ${templates.length} قالب في localStorage`);
      
      // حفظ في ملف مؤقت للأمان
      const backupPath = path.join(__dirname, '..', 'templates_backup.json');
      fs.writeFileSync(backupPath, JSON.stringify(templates, null, 2));
      console.log(`💾 تم حفظ نسخة احتياطية في: ${backupPath}`);
      
      // استيراد
      importFromLocalStorageData(templates).then(resolve).catch(reject);
      
    } catch (error) {
      reject(new Error(`خطأ في تحليل JSON: ${error.message}`));
    }
  });
};

const importFromLocalStorageData = (templates) => {
  return new Promise((resolve, reject) => {
    let imported = 0;
    let errors = [];
    
    const importNext = (index) => {
      if (index >= templates.length) {
        resolve({ imported, total: templates.length, errors });
        return;
      }
      
      const template = templates[index];
      
      // التحقق من البيانات المطلوبة
      if (!template.title) {
        errors.push(`القالب ${index + 1}: مفقود العنوان`);
        importNext(index + 1);
        return;
      }
      
      // إنشاء معرف فريد إذا لم يكن موجوداً
      const id = template.id || `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      
      // تحويل البيانات للتوافق
      const stages = JSON.stringify(template.stages || []);
      const objectives = JSON.stringify(template.objectives || []);
      const resources = JSON.stringify(template.resources || []);
      const assessment = JSON.stringify(template.assessment || {});
      const homework = JSON.stringify(template.homework || {});
      
      db.run(`
        INSERT OR REPLACE INTO LessonTemplates (
          id, title, subject, grade, duration, objectives, content, 
          stages, resources, assessment, homework, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        template.title,
        template.subject || template.courseName || 'غير محدد',
        template.grade || template.level || 'غير محدد',
        template.duration || (template.estimatedSessions ? template.estimatedSessions * 50 : 50),
        objectives,
        template.content || template.description || '',
        stages,
        resources,
        assessment,
        homework,
        template.notes || ''
      ], function(err) {
        if (err) {
          errors.push(`القالب "${template.title}": ${err.message}`);
        } else {
          imported++;
          console.log(`✅ ${imported}/${templates.length} - ${template.title}`);
        }
        
        importNext(index + 1);
      });
    };
    
    importNext(0);
  });
};

// عرض الإحصائيات النهائية
const showStats = () => {
  return new Promise((resolve) => {
    db.get("SELECT COUNT(*) as count FROM LessonTemplates", (err, result) => {
      if (err) {
        console.log('❌ خطأ في جلب الإحصائيات:', err.message);
      } else {
        console.log('\n📊 إحصائيات النظام:');
        console.log(`   📚 إجمالي القوالب: ${result.count}`);
        
        // إحصائيات حسب المادة
        db.all("SELECT subject, COUNT(*) as count FROM LessonTemplates GROUP BY subject", (err, subjects) => {
          if (!err && subjects.length > 0) {
            console.log('   📖 حسب المادة:');
            subjects.forEach(s => console.log(`      - ${s.subject}: ${s.count} قالب`));
          }
          
          // إحصائيات حسب الصف
          db.all("SELECT grade, COUNT(*) as count FROM LessonTemplates GROUP BY grade", (err, grades) => {
            if (!err && grades.length > 0) {
              console.log('   🎓 حسب الصف:');
              grades.forEach(g => console.log(`      - ${g.grade}: ${g.count} قالب`));
            }
            resolve();
          });
        });
      }
    });
  });
};

// الواجهة الرئيسية
const main = async () => {
  try {
    await checkSetup();
    
    console.log('\nاختر طريقة الاستيراد:');
    console.log('1. استيراد من ملف JSON');
    console.log('2. استيراد من localStorage (نسخ JSON)');
    console.log('3. عرض الإحصائيات الحالية فقط');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('\nأدخل رقم الخيار (1-3): ', async (choice) => {
      try {
        if (choice === '1') {
          rl.question('أدخل مسار ملف JSON: ', async (filePath) => {
            try {
              const result = await importFromFile(filePath);
              console.log(`\n🎉 تم الاستيراد بنجاح!`);
              console.log(`   ✅ تم استيراد: ${result.imported} من ${result.total}`);
              if (result.errors.length > 0) {
                console.log(`   ❌ أخطاء: ${result.errors.length}`);
                result.errors.forEach(error => console.log(`      - ${error}`));
              }
              await showStats();
            } catch (error) {
              console.log('❌ خطأ في الاستيراد:', error.message);
            }
            rl.close();
            db.close();
          });
        } else if (choice === '2') {
          console.log('\nألصق بيانات localStorage هنا (JSON)، ثم اضغط Enter مرتين:');
          let jsonInput = '';
          
          rl.on('line', (line) => {
            if (line.trim() === '' && jsonInput.trim() !== '') {
              // المستخدم انتهى من الإدخال
              importFromLocalStorage(jsonInput)
                .then(async (result) => {
                  console.log(`\n🎉 تم الاستيراد بنجاح!`);
                  console.log(`   ✅ تم استيراد: ${result.imported} من ${result.total}`);
                  if (result.errors.length > 0) {
                    console.log(`   ❌ أخطاء: ${result.errors.length}`);
                    result.errors.forEach(error => console.log(`      - ${error}`));
                  }
                  await showStats();
                  rl.close();
                  db.close();
                })
                .catch((error) => {
                  console.log('❌ خطأ في الاستيراد:', error.message);
                  rl.close();
                  db.close();
                });
            } else {
              jsonInput += line + '\n';
            }
          });
        } else if (choice === '3') {
          await showStats();
          rl.close();
          db.close();
        } else {
          console.log('❌ خيار غير صحيح');
          rl.close();
          db.close();
        }
      } catch (error) {
        console.log('❌ خطأ:', error.message);
        rl.close();
        db.close();
      }
    });
    
  } catch (error) {
    console.log('❌ خطأ في الإعداد:', error.message);
    console.log('\nتأكد من تشغيل الأمر التالي أولاً:');
    console.log('node create_lesson_templates_table.js');
    db.close();
  }
};

// تشغيل البرنامج
if (require.main === module) {
  main();
}

module.exports = { importFromFile, importFromLocalStorage, checkSetup };