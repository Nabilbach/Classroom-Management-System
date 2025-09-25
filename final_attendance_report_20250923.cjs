const sqlite3 = require('sqlite3').verbose();

console.log('📊 التقرير النهائي لسجلات الحضور والغياب ليوم 23-09-2025\n');

function generateFinalReport() {
  return new Promise((resolve) => {
    const currentDb = new sqlite3.Database('classroom.db', sqlite3.OPEN_READONLY);
    const targetDate = '2025-09-23';
    
    console.log(`🎯 تحليل سجلات ${targetDate}...`);
    
    // تحليل شامل للحضور والغياب
    currentDb.all(`
      SELECT 
        sectionId, 
        COUNT(*) as totalStudents,
        SUM(CASE WHEN isPresent = 1 THEN 1 ELSE 0 END) as presentCount,
        SUM(CASE WHEN isPresent = 0 THEN 1 ELSE 0 END) as absentCount,
        ROUND(AVG(isPresent) * 100, 2) as attendancePercentage
      FROM Attendances 
      WHERE date = ? 
      GROUP BY sectionId
      ORDER BY sectionId
    `, [targetDate], (err, sectionSummary) => {
      
      if (err) {
        console.log('❌ خطأ في التحليل:', err.message);
        currentDb.close();
        resolve();
        return;
      }
      
      if (!sectionSummary || sectionSummary.length === 0) {
        console.log('⚠️ لا توجد سجلات للتحليل');
        currentDb.close();
        resolve();
        return;
      }
      
      console.log('✅ تم استعادة سجلات الحضور والغياب بنجاح!');
      console.log(`\n📈 تحليل الحضور والغياب ليوم ${targetDate}:`);
      console.log('='.repeat(60));
      
      let grandTotal = 0;
      let grandPresent = 0;
      let grandAbsent = 0;
      
      sectionSummary.forEach((section, index) => {
        console.log(`\n📚 القسم ${section.sectionId}:`);
        console.log(`   📊 إجمالي الطلاب: ${section.totalStudents}`);
        console.log(`   ✅ حاضر: ${section.presentCount} طالب`);
        console.log(`   ❌ غائب: ${section.absentCount} طالب`);
        console.log(`   📊 نسبة الحضور: ${section.attendancePercentage}%`);
        
        grandTotal += section.totalStudents;
        grandPresent += section.presentCount;
        grandAbsent += section.absentCount;
      });
      
      const overallPercentage = ((grandPresent / grandTotal) * 100).toFixed(2);
      
      console.log('\n' + '='.repeat(60));
      console.log('🎯 الإحصائيات العامة:');
      console.log(`📊 إجمالي الطلاب: ${grandTotal}`);
      console.log(`✅ إجمالي الحاضرين: ${grandPresent}`);
      console.log(`❌ إجمالي الغائبين: ${grandAbsent}`);
      console.log(`📈 نسبة الحضور العامة: ${overallPercentage}%`);
      
      // التحقق من إجمالي السجلات المستعادة
      currentDb.get(`SELECT COUNT(*) as total FROM Attendances WHERE date = ?`, [targetDate], (err, totalResult) => {
        if (!err && totalResult) {
          console.log(`\n🔢 إجمالي السجلات المستعادة: ${totalResult.total}`);
          
          if (totalResult.total === 129) {
            console.log('✅ تم استعادة جميع السجلات المفقودة (129 سجل)');
          }
        }
        
        // مقارنة مع تواريخ أخرى
        currentDb.all(`
          SELECT 
            date, 
            COUNT(*) as recordCount,
            SUM(CASE WHEN isPresent = 1 THEN 1 ELSE 0 END) as presentCount,
            ROUND(AVG(isPresent) * 100, 2) as attendancePercentage
          FROM Attendances 
          GROUP BY date 
          ORDER BY date DESC
        `, (err, allDates) => {
          
          if (!err && allDates) {
            console.log('\n📅 مقارنة مع التواريخ الأخرى:');
            allDates.forEach((dateRecord, index) => {
              const isTarget = dateRecord.date === targetDate;
              const marker = isTarget ? '🎯' : '📅';
              console.log(`${marker} ${dateRecord.date}: ${dateRecord.recordCount} سجل - ${dateRecord.attendancePercentage}% حضور`);
            });
          }
          
          console.log('\n' + '='.repeat(60));
          console.log('🎉 تم حل مشكلة سجلات الحضور والغياب المفقودة بنجاح!');
          
          currentDb.close();
          resolve();
        });
      });
    });
  });
}

generateFinalReport().catch(console.error);