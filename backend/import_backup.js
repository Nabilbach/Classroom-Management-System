const fs = require('fs');
const path = require('path');
const db = require('./config/database');

console.log('🔧 أداة استيراد النسخة الاحتياطية لقوالب الدروس');
console.log('='.repeat(50));

// قراءة ملف النسخة الاحتياطية
const backupFilePath = process.argv[2];

if (!backupFilePath) {
  console.log('❌ يرجى تحديد مسار ملف النسخة الاحتياطية');
  console.log('الاستخدام: node import_backup.js [مسار_الملف]');
  console.log('');
  console.log('أمثلة:');
  console.log('  node import_backup.js backup.json');
  console.log('  node import_backup.js "C:\\path\\to\\templates_backup.json"');
  process.exit(1);
}

// التحقق من وجود الملف
if (!fs.existsSync(backupFilePath)) {
  console.log('❌ الملف غير موجود:', backupFilePath);
  process.exit(1);
}

try {
  // قراءة النسخة الاحتياطية
  console.log('📂 قراءة النسخة الاحتياطية من:', backupFilePath);
  const backupData = fs.readFileSync(backupFilePath, 'utf8');
  const templates = JSON.parse(backupData);

  if (!Array.isArray(templates)) {
    console.log('❌ تنسيق الملف غير صحيح - يجب أن يكون مصفوفة من القوالب');
    process.exit(1);
  }

  console.log(`📊 تم العثور على ${templates.length} قالب في النسخة الاحتياطية`);

  // التحقق من الهيكل
  let imported = 0;
  let skipped = 0;
  let errors = [];

  const importTemplate = (template, index) => {
    return new Promise((resolve) => {
      // إنشاء معرف فريد إذا لم يكن موجوداً
      const id = template.id || `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      
      // التحقق من البيانات الأساسية
      if (!template.title) {
        errors.push(`القالب ${index + 1}: العنوان مفقود`);
        return resolve();
      }

      // تحضير البيانات
      const templateData = {
        id,
        title: template.title,
        subject: template.subject || 'غير محدد',
        grade: template.grade || 'غير محدد', 
        duration: template.duration || 50,
        objectives: JSON.stringify(template.objectives || []),
        content: template.content || '',
        stages: JSON.stringify(template.stages || []),
        resources: JSON.stringify(template.resources || []),
        assessment: JSON.stringify(template.assessment || {}),
        homework: JSON.stringify(template.homework || {}),
        notes: template.notes || ''
      };

      // التحقق من وجود القالب أولاً
      db.get('SELECT id FROM LessonTemplates WHERE id = ?', [id], (err, existing) => {
        if (err) {
          errors.push(`القالب "${template.title}": خطأ في التحقق - ${err.message}`);
          return resolve();
        }

        if (existing) {
          console.log(`⚠️ القالب "${template.title}" موجود بالفعل - تجاهل`);
          skipped++;
          return resolve();
        }

        // إدراج القالب الجديد
        db.run(`
          INSERT INTO LessonTemplates (
            id, title, subject, grade, duration, objectives, content, 
            stages, resources, assessment, homework, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          templateData.id, templateData.title, templateData.subject, 
          templateData.grade, templateData.duration, templateData.objectives,
          templateData.content, templateData.stages, templateData.resources,
          templateData.assessment, templateData.homework, templateData.notes
        ], function(err) {
          if (err) {
            errors.push(`القالب "${template.title}": ${err.message}`);
          } else {
            imported++;
            console.log(`✅ تم استيراد: ${template.title}`);
          }
          resolve();
        });
      });
    });
  };

  // استيراد القوالب بالتسلسل
  const importAll = async () => {
    console.log('🔄 بدء عملية الاستيراد...');
    console.log('');

    for (let i = 0; i < templates.length; i++) {
      await importTemplate(templates[i], i);
    }

    // النتائج النهائية
    console.log('');
    console.log('📋 نتائج الاستيراد:');
    console.log('='.repeat(30));
    console.log(`✅ تم استيراد: ${imported} قالب`);
    console.log(`⚠️ تم تجاهل: ${skipped} قالب (موجود مسبقاً)`);
    console.log(`❌ فشل: ${errors.length} قالب`);

    if (errors.length > 0) {
      console.log('');
      console.log('🚨 الأخطاء:');
      errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }

    // التحقق من العدد النهائي
    db.get('SELECT COUNT(*) as count FROM LessonTemplates', (err, result) => {
      if (err) {
        console.log('❌ خطأ في التحقق من العدد النهائي:', err.message);
      } else {
        console.log('');
        console.log(`📊 إجمالي القوالب في قاعدة البيانات الآن: ${result.count}`);
      }
      
      console.log('');
      console.log('🎉 انتهت عملية الاستيراد!');
      db.close();
    });
  };

  importAll().catch(err => {
    console.error('❌ خطأ في عملية الاستيراد:', err);
    db.close();
  });

} catch (error) {
  console.log('❌ خطأ في قراءة الملف:', error.message);
  process.exit(1);
}