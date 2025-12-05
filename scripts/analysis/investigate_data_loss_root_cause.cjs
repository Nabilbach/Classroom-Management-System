const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🔍 تحقيق شامل في سبب اختفاء سجلات يوم 23-09-2025 تحديداً\n');

function investigateDataLoss() {
  return new Promise((resolve) => {
    const currentDb = new sqlite3.Database('classroom.db', sqlite3.OPEN_READONLY);
    const backupDb = new sqlite3.Database('classroom_backup_20250924_174347.db', sqlite3.OPEN_READONLY);
    
    console.log('1️⃣ فحص جميع التواريخ في قاعدة البيانات الحالية مقابل النسخة الاحتياطية...');
    
    // مقارنة جميع التواريخ
    currentDb.all(`
      SELECT date, COUNT(*) as current_count 
      FROM Attendances 
      GROUP BY date 
      ORDER BY date
    `, (err, currentDates) => {
      
      if (err) {
        console.log('❌ خطأ في قراءة التواريخ الحالية:', err.message);
        currentDb.close();
        backupDb.close();
        resolve();
        return;
      }
      
      backupDb.all(`
        SELECT date, COUNT(*) as backup_count 
        FROM Attendances 
        GROUP BY date 
        ORDER BY date
      `, (err, backupDates) => {
        
        if (err) {
          console.log('❌ خطأ في قراءة تواريخ النسخة الاحتياطية:', err.message);
          currentDb.close();
          backupDb.close();
          resolve();
          return;
        }
        
        console.log('📊 مقارنة السجلات حسب التاريخ:');
        console.log('التاريخ\t\tالحالية\tالنسخة الاحتياطية\tالحالة');
        console.log('-'.repeat(70));
        
        // إنشاء خريطة للمقارنة
        const currentMap = new Map(currentDates.map(d => [d.date, d.current_count]));
        const backupMap = new Map(backupDates.map(d => [d.date, d.backup_count]));
        
        // جمع جميع التواريخ الفريدة
        const allDates = new Set([...currentDates.map(d => d.date), ...backupDates.map(d => d.date)]);
        const sortedDates = Array.from(allDates).sort();
        
        let missingDates = [];
        let partialLossDates = [];
        
        sortedDates.forEach(date => {
          const currentCount = currentMap.get(date) || 0;
          const backupCount = backupMap.get(date) || 0;
          
          let status = '✅ سليم';
          if (currentCount === 0 && backupCount > 0) {
            status = '🚨 مفقود بالكامل';
            missingDates.push({ date, backupCount });
          } else if (currentCount < backupCount) {
            status = '⚠️ فقدان جزئي';
            partialLossDates.push({ date, currentCount, backupCount });
          } else if (currentCount > backupCount) {
            status = '📈 زيادة';
          }
          
          console.log(`${date}\t\t${currentCount}\t\t${backupCount}\t\t\t${status}`);
        });
        
        console.log('\n2️⃣ تحليل أنماط الفقدان:');
        
        if (missingDates.length > 0) {
          console.log(`\n🚨 تواريخ مفقودة بالكامل (${missingDates.length}):`);
          missingDates.forEach(item => {
            console.log(`   📅 ${item.date}: ${item.backupCount} سجل مفقود`);
          });
        }
        
        if (partialLossDates.length > 0) {
          console.log(`\n⚠️ تواريخ بفقدان جزئي (${partialLossDates.length}):`);
          partialLossDates.forEach(item => {
            const lossPercent = ((item.backupCount - item.currentCount) / item.backupCount * 100).toFixed(2);
            console.log(`   📅 ${item.date}: ${item.currentCount}/${item.backupCount} (${lossPercent}% فقدان)`);
          });
        }
        
        // تحليل الأنماط الزمنية
        console.log('\n3️⃣ تحليل النمط الزمني:');
        if (missingDates.length > 0) {
          const missingDatesList = missingDates.map(d => d.date).sort();
          console.log(`📅 أول تاريخ مفقود: ${missingDatesList[0]}`);
          console.log(`📅 آخر تاريخ مفقود: ${missingDatesList[missingDatesList.length - 1]}`);
          
          // فحص التسلسل
          const isConsecutive = missingDatesList.length > 1;
          if (isConsecutive) {
            console.log('📊 التواريخ المفقودة متتالية: نعم');
          } else {
            console.log('📊 التواريخ المفقودة متتالية: لا');
          }
        }
        
        // فحص تواريخ إنشاء السجلات للبحث عن أدلة
        console.log('\n4️⃣ فحص تواريخ إنشاء السجلات (createdAt):');
        
        backupDb.all(`
          SELECT 
            date,
            MIN(createdAt) as first_created,
            MAX(createdAt) as last_created,
            COUNT(*) as record_count
          FROM Attendances 
          GROUP BY date 
          ORDER BY date
        `, (err, creationTimes) => {
          
          if (!err && creationTimes) {
            console.log('التاريخ\t\tأول إنشاء\t\t\tآخر إنشاء');
            console.log('-'.repeat(80));
            
            creationTimes.forEach(item => {
              const isMissing = missingDates.some(m => m.date === item.date);
              const marker = isMissing ? '🚨' : '✅';
              console.log(`${marker} ${item.date}\t${item.first_created}\t${item.last_created}`);
            });
          }
          
          // البحث عن علاقة مع الحصص المجدولة
          console.log('\n5️⃣ فحص العلاقة مع الحصص المجدولة:');
          
          currentDb.all(`SELECT date FROM ScheduledLessons ORDER BY date`, (err, currentLessons) => {
            if (!err && currentLessons) {
              backupDb.all(`SELECT date FROM ScheduledLessons ORDER BY date`, (err, backupLessons) => {
                if (!err && backupLessons) {
                  const currentLessonDates = new Set(currentLessons.map(l => l.date));
                  const backupLessonDates = new Set(backupLessons.map(l => l.date));
                  
                  console.log('📅 تواريخ الحصص في قاعدة البيانات الحالية:', Array.from(currentLessonDates).sort().join(', '));
                  console.log('📅 تواريخ الحصص في النسخة الاحتياطية:', Array.from(backupLessonDates).sort().join(', '));
                  
                  // فحص التطابق مع السجلات المفقودة
                  if (missingDates.length > 0) {
                    console.log('\n🔍 فحص تطابق التواريخ المفقودة مع الحصص المفقودة:');
                    const missingLessonDates = Array.from(backupLessonDates).filter(d => !currentLessonDates.has(d));
                    
                    missingDates.forEach(missing => {
                      const hasMatchingLesson = missingLessonDates.includes(missing.date);
                      console.log(`📅 ${missing.date}: ${hasMatchingLesson ? '✅ يطابق حصة مفقودة' : '❌ لا يطابق حصة مفقودة'}`);
                    });
                    
                    if (missingLessonDates.length > 0) {
                      console.log('\n🎯 النتيجة: السجلات المفقودة تتطابق مع الحصص المفقودة!');
                      console.log('💡 هذا يشير إلى أن السبب واحد للمشكلتين');
                    }
                  }
                  
                  // تحليل توقيت المشكلة
                  console.log('\n6️⃣ تحليل توقيت المشكلة:');
                  const backupCreationTime = require('fs').statSync('classroom_backup_20250924_174347.db').mtime;
                  console.log(`📅 تاريخ إنشاء النسخة الاحتياطية: ${backupCreationTime.toLocaleString()}`);
                  console.log(`📅 التاريخ الحالي: ${new Date().toLocaleString()}`);
                  
                  const hoursSinceBackup = (Date.now() - backupCreationTime.getTime()) / (1000 * 60 * 60);
                  console.log(`⏰ مضى على النسخة الاحتياطية: ${hoursSinceBackup.toFixed(2)} ساعة`);
                  
                  console.log('\n' + '='.repeat(80));
                  console.log('🎯 خلاصة التحقيق:');
                  
                  if (missingDates.length === 1 && missingDates[0].date === '2025-09-23') {
                    console.log('📊 يوم 23-09-2025 هو التاريخ الوحيد المفقود من سجلات الحضور');
                    console.log('🔗 يتطابق مع نفس التاريخ المفقود من الحصص المجدولة');
                    console.log('💡 السبب المحتمل: عملية حذف أو تراجع تمت على هذا التاريخ تحديداً');
                    console.log('⚠️ قد يكون السبب: عملية rollback أو migration خاطئة');
                  }
                  
                  currentDb.close();
                  backupDb.close();
                  resolve();
                }
              });
            }
          });
        });
      });
    });
  });
}

investigateDataLoss().catch(console.error);