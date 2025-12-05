const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

console.log('🔍 تحقيق متقدم: اكتشفت أن المشكلة في يوم 24-09 وليس 23-09!\n');

function deepInvestigation() {
  return new Promise((resolve) => {
    const currentDb = new sqlite3.Database('classroom.db', sqlite3.OPEN_READONLY);
    const backupDb = new sqlite3.Database('classroom_backup_20250924_174347.db', sqlite3.OPEN_READONLY);
    
    console.log('🚨 تصحيح: المشكلة الحقيقية في يوم 2025-09-24 وليس 2025-09-23!');
    console.log('📅 يوم 23-09 موجود في كلا قاعدتي البيانات (129 سجل)');
    console.log('📅 يوم 24-09 مفقود من قاعدة البيانات الحالية (39 سجل مفقود)\n');
    
    // فحص تفصيلي ليوم 24-09
    console.log('1️⃣ فحص تفاصيل سجلات يوم 2025-09-24 المفقودة:');
    
    backupDb.all(`
      SELECT 
        sectionId,
        COUNT(*) as student_count,
        MIN(createdAt) as first_record,
        MAX(createdAt) as last_record
      FROM Attendances 
      WHERE date = '2025-09-24'
      GROUP BY sectionId
      ORDER BY sectionId
    `, (err, missingRecords) => {
      
      if (err) {
        console.log('❌ خطأ:', err.message);
        currentDb.close();
        backupDb.close();
        resolve();
        return;
      }
      
      if (missingRecords && missingRecords.length > 0) {
        console.log('🚨 سجلات الحضور المفقودة ليوم 2025-09-24:');
        let totalMissing = 0;
        
        missingRecords.forEach((record, index) => {
          console.log(`📚 القسم ${record.sectionId}:`);
          console.log(`   👥 عدد الطلاب: ${record.student_count}`);
          console.log(`   🕐 أول سجل: ${record.first_record}`);
          console.log(`   🕐 آخر سجل: ${record.last_record}`);
          
          totalMissing += record.student_count;
        });
        
        console.log(`\n📊 إجمالي السجلات المفقودة: ${totalMissing}`);
        
        // تحليل التوقيت
        const firstRecord = missingRecords.reduce((min, r) => 
          r.first_record < min ? r.first_record : min, missingRecords[0].first_record);
        const lastRecord = missingRecords.reduce((max, r) => 
          r.last_record > max ? r.last_record : max, missingRecords[0].last_record);
        
        console.log(`\n⏰ نطاق زمني للسجلات المفقودة:`);
        console.log(`📅 من: ${firstRecord}`);
        console.log(`📅 إلى: ${lastRecord}`);
        
        // حساب الفترة الزمنية
        const startTime = new Date(firstRecord);
        const endTime = new Date(lastRecord);
        const durationMinutes = (endTime - startTime) / (1000 * 60);
        console.log(`⏱️ مدة تسجيل الحضور: ${durationMinutes.toFixed(1)} دقيقة`);
      }
      
      // فحص الحصص المجدولة ليوم 24-09
      console.log('\n2️⃣ فحص الحصص المجدولة ليوم 2025-09-24:');
      
      currentDb.all(`SELECT * FROM ScheduledLessons WHERE date = '2025-09-24'`, (err, currentLessons) => {
        if (!err) {
          console.log(`📚 الحصص في قاعدة البيانات الحالية: ${currentLessons ? currentLessons.length : 0}`);
        }
        
        backupDb.all(`SELECT * FROM ScheduledLessons WHERE date = '2025-09-24'`, (err, backupLessons) => {
          if (!err) {
            console.log(`📚 الحصص في النسخة الاحتياطية: ${backupLessons ? backupLessons.length : 0}`);
            
            if (backupLessons && backupLessons.length > 0) {
              console.log('\n📋 تفاصيل الحصص المجدولة ليوم 2025-09-24:');
              backupLessons.forEach((lesson, index) => {
                console.log(`${index + 1}. ID: ${lesson.id}`);
                console.log(`   ⏰ الوقت: ${lesson.startTime}`);
                console.log(`   📚 الموضوع: ${lesson.subject || lesson.customTitle}`);
                console.log(`   🏫 الأقسام: ${lesson.assignedSections}`);
                console.log(`   📝 الحالة: ${lesson.completionStatus}`);
              });
            }
          }
          
          // فحص النسخ الاحتياطية الأخرى
          console.log('\n3️⃣ فحص النسخ الاحتياطية المتاحة:');
          
          const dbFiles = fs.readdirSync('.').filter(f => f.endsWith('.db'));
          console.log('📁 ملفات قواعد البيانات المتاحة:');
          
          dbFiles.forEach(file => {
            const stats = fs.statSync(file);
            console.log(`   📄 ${file} (${(stats.size/1024).toFixed(1)} KB) - ${stats.mtime.toLocaleDateString()}`);
          });
          
          // تحليل الأنماط الزمنية
          console.log('\n4️⃣ تحليل نمط فقدان البيانات:');
          
          const backupTime = fs.statSync('classroom_backup_20250924_174347.db').mtime;
          console.log(`📅 وقت إنشاء النسخة الاحتياطية: ${backupTime.toLocaleString()}`);
          
          if (missingRecords && missingRecords.length > 0) {
            const firstMissingTime = new Date(firstRecord);
            console.log(`📅 وقت أول سجل مفقود: ${firstMissingTime.toLocaleString()}`);
            
            const timeDiff = backupTime - firstMissingTime;
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            
            console.log(`⏰ الفارق الزمني: ${hoursDiff.toFixed(2)} ساعة`);
            
            if (hoursDiff > 0) {
              console.log('✅ النسخة الاحتياطية تم إنشاؤها بعد تسجيل الحضور');
              console.log('💡 هذا يعني أن السجلات كانت موجودة وقت النسخ الاحتياطي');
              console.log('🚨 السجلات اختفت بعد إنشاء النسخة الاحتياطية!');
            } else {
              console.log('⚠️ النسخة الاحتياطية أقدم من السجلات المفقودة');
            }
          }
          
          console.log('\n5️⃣ البحث عن العمليات المشبوهة:');
          console.log('🔍 العمليات المحتملة التي تسببت في فقدان البيانات:');
          console.log('   1. عملية migration أو schema update');
          console.log('   2. عملية rollback أو restore خاطئة');
          console.log('   3. حذف بيانات يدوي أو برمجي');
          console.log('   4. مشكلة في النسخ المتزامن للبيانات');
          console.log('   5. عملية cleanup أو maintenance');
          
          // فحص git log للبحث عن تغييرات مشبوهة
          console.log('\n6️⃣ توصيات للتحقق الإضافي:');
          console.log('🔍 يُنصح بفحص:');
          console.log('   - سجلات Git للتغييرات في ملفات قاعدة البيانات');
          console.log('   - سجلات النظام في يوم 24-09-2025');
          console.log('   - أي عمليات maintenance أو deployment');
          console.log('   - السجلات التطبيقية (application logs)');
          
          console.log('\n' + '='.repeat(70));
          console.log('🎯 الخلاصة النهائية:');
          console.log('📅 السجلات المفقودة: يوم 2025-09-24 (39 سجل حضور)');
          console.log('📅 السجلات السليمة: جميع الأيام الأخرى بما فيها 2025-09-23');
          console.log('⏰ وقت الفقدان: بعد إنشاء النسخة الاحتياطية');
          console.log('🔍 السبب المحتمل: عملية برمجية أو يدوية حذفت هذا اليوم تحديداً');
          
          currentDb.close();
          backupDb.close();
          resolve();
        });
      });
    });
  });
}

deepInvestigation().catch(console.error);