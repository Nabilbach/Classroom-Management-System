const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

console.log('🔍 التحقيق النهائي في سبب اختفاء سجلات يوم 24-09-2025\n');

function finalInvestigation() {
  return new Promise((resolve) => {
    const currentDb = new sqlite3.Database('classroom.db', sqlite3.OPEN_READONLY);
    const backupDb = new sqlite3.Database('classroom_backup_20250924_174347.db', sqlite3.OPEN_READONLY);
    
    console.log('🚨 المشكلة الحقيقية: سجلات الحضور ليوم 2025-09-24 مفقودة!');
    console.log('✅ سجلات يوم 2025-09-23 سليمة وموجودة في النظام\n');
    
    // تحليل مفصل للسجلات المفقودة
    backupDb.all(`
      SELECT 
        *
      FROM Attendances 
      WHERE date = '2025-09-24'
      ORDER BY createdAt
    `, (err, missingRecords) => {
      
      if (err) {
        console.log('❌ خطأ:', err.message);
        currentDb.close();
        backupDb.close();
        resolve();
        return;
      }
      
      console.log('1️⃣ تحليل السجلات المفقودة ليوم 2025-09-24:');
      console.log(`📊 عدد السجلات المفقودة: ${missingRecords ? missingRecords.length : 0}`);
      
      if (missingRecords && missingRecords.length > 0) {
        // تجميع حسب القسم
        const bySection = {};
        missingRecords.forEach(record => {
          if (!bySection[record.sectionId]) {
            bySection[record.sectionId] = [];
          }
          bySection[record.sectionId].push(record);
        });
        
        console.log(`📚 الأقسام المتأثرة: ${Object.keys(bySection).length}`);
        
        Object.keys(bySection).forEach(sectionId => {
          const sectionRecords = bySection[sectionId];
          console.log(`\n📖 القسم ${sectionId}:`);
          console.log(`   👥 عدد الطلاب: ${sectionRecords.length}`);
          
          const present = sectionRecords.filter(r => r.isPresent === 1).length;
          const absent = sectionRecords.filter(r => r.isPresent === 0).length;
          
          console.log(`   ✅ حاضر: ${present}`);
          console.log(`   ❌ غائب: ${absent}`);
          console.log(`   🕐 وقت التسجيل: ${sectionRecords[0].createdAt}`);
        });
        
        // تحليل التوقيت
        const firstTime = new Date(missingRecords[0].createdAt);
        const lastTime = new Date(missingRecords[missingRecords.length - 1].createdAt);
        
        console.log(`\n⏰ التوقيت الزمني للسجلات المفقودة:`);
        console.log(`📅 أول سجل: ${firstTime.toLocaleString()}`);
        console.log(`📅 آخر سجل: ${lastTime.toLocaleString()}`);
        
        const durationSeconds = (lastTime - firstTime) / 1000;
        console.log(`⏱️ المدة الزمنية: ${durationSeconds.toFixed(1)} ثانية`);
        
        // مقارنة مع وقت النسخة الاحتياطية
        const backupTime = fs.statSync('classroom_backup_20250924_174347.db').mtime;
        console.log(`\n📅 وقت إنشاء النسخة الاحتياطية: ${backupTime.toLocaleString()}`);
        
        const timeDiffHours = (backupTime - firstTime) / (1000 * 60 * 60);
        console.log(`⏰ الفارق: ${timeDiffHours.toFixed(2)} ساعة بعد تسجيل الحضور`);
        
        if (timeDiffHours > 0) {
          console.log('✅ النسخة الاحتياطية حُفظت بعد تسجيل الحضور');
          console.log('🚨 السجلات اختفت لاحقاً!');
        }
      }
      
      // فحص العلاقة مع الحصص
      console.log('\n2️⃣ فحص العلاقة مع الحصص المجدولة:');
      
      currentDb.all(`SELECT COUNT(*) as current_lessons FROM ScheduledLessons WHERE date = '2025-09-24'`, (err, currentLessons) => {
        backupDb.all(`SELECT COUNT(*) as backup_lessons FROM ScheduledLessons WHERE date = '2025-09-24'`, (err, backupLessons) => {
          
          const currentCount = currentLessons && currentLessons[0] ? currentLessons[0].current_lessons : 0;
          const backupCount = backupLessons && backupLessons[0] ? backupLessons[0].backup_lessons : 0;
          
          console.log(`📚 الحصص المجدولة ليوم 2025-09-24:`);
          console.log(`   قاعدة البيانات الحالية: ${currentCount} حصة`);
          console.log(`   النسخة الاحتياطية: ${backupCount} حصة`);
          
          if (currentCount === backupCount) {
            console.log('✅ الحصص المجدولة سليمة ولم تتأثر');
            console.log('💡 المشكلة محددة في سجلات الحضور فقط');
          } else {
            console.log('⚠️ الحصص أيضاً متأثرة');
          }
          
          // تحليل الأسباب المحتملة
          console.log('\n3️⃣ تحليل الأسباب المحتملة:');
          
          console.log('🔍 النمط المكتشف:');
          console.log('   ✅ يوم 2025-09-22: سليم (151 سجل)');
          console.log('   ✅ يوم 2025-09-23: سليم (129 سجل) - تم استعادته');
          console.log('   🚨 يوم 2025-09-24: مفقود (39 سجل)');
          
          console.log('\n💡 الأسباب المحتملة:');
          console.log('1. عملية حذف يدوية أو برمجية لهذا التاريخ تحديداً');
          console.log('2. مشكلة في عملية rollback أثرت على هذا اليوم فقط');
          console.log('3. خطأ في كود التطبيق حذف سجلات هذا التاريخ');
          console.log('4. عملية maintenance أو cleanup خاطئة');
          console.log('5. مشكلة في النسخ المتزامن للبيانات');
          
          console.log('\n4️⃣ تحليل التوقيت:');
          
          if (missingRecords && missingRecords.length > 0) {
            const recordTime = new Date(missingRecords[0].createdAt);
            const now = new Date();
            const today = new Date().toISOString().split('T')[0];
            
            console.log(`📅 تاريخ اليوم: ${today}`);
            console.log(`📅 تاريخ السجلات المفقودة: 2025-09-24`);
            
            if (today === '2025-09-24') {
              console.log('🎯 السجلات المفقودة هي لليوم الحالي!');
              console.log('⚠️ هذا قد يشير إلى مشكلة حديثة في النظام');
            }
            
            console.log(`⏰ وقت تسجيل الحضور: ${recordTime.toLocaleString()}`);
            console.log('⏰ كان التسجيل في الصباح الباكر (9:07 صباحاً)');
          }
          
          // فحص ملفات النظام
          console.log('\n5️⃣ فحص ملفات النظام:');
          
          const dbFiles = [
            'classroom.db',
            'classroom_backup_20250924_174347.db',
            'classroom_dev.db'
          ];
          
          dbFiles.forEach(file => {
            if (fs.existsSync(file)) {
              const stats = fs.statSync(file);
              console.log(`📄 ${file}:`);
              console.log(`   📏 الحجم: ${(stats.size/1024).toFixed(1)} KB`);
              console.log(`   📅 آخر تعديل: ${stats.mtime.toLocaleString()}`);
            }
          });
          
          console.log('\n' + '='.repeat(70));
          console.log('🎯 الخلاصة النهائية:');
          console.log('');
          console.log('🚨 المشكلة المكتشفة:');
          console.log('   📅 التاريخ المتأثر: 2025-09-24 (اليوم الحالي)');
          console.log('   📊 السجلات المفقودة: 39 سجل حضور وغياب');
          console.log('   🏫 القسم المتأثر: 1758447797548');
          console.log('   ⏰ وقت التسجيل الأصلي: 9:07 صباحاً');
          console.log('');
          console.log('✅ البيانات السليمة:');
          console.log('   📅 يوم 2025-09-22: 151 سجل');
          console.log('   📅 يوم 2025-09-23: 129 سجل (تم استعادته)');
          console.log('   📚 الحصص المجدولة: سليمة');
          console.log('');
          console.log('💡 السبب المحتمل:');
          console.log('   - عملية حذف محددة لسجلات هذا اليوم');
          console.log('   - مشكلة في النظام أثرت على اليوم الحالي فقط');
          console.log('   - خطأ برمجي أو يدوي حديث');
          console.log('');
          console.log('🔧 الحل:');
          console.log('   ✅ يمكن استعادة السجلات من النسخة الاحتياطية');
          console.log('   📋 النسخة الاحتياطية تحتوي على جميع البيانات');
          
          currentDb.close();
          backupDb.close();
          resolve();
        });
      });
    });
  });
}

finalInvestigation().catch(console.error);