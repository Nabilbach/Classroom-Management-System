const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🔍 البحث عن سجلات الحضور والغياب ليوم 23-09-2025\n');

function checkAttendanceRecords() {
  return new Promise((resolve) => {
    const currentDb = new sqlite3.Database('classroom.db', sqlite3.OPEN_READONLY);
    const targetDate = '2025-09-23';
    
    console.log(`🎯 البحث عن السجلات في التاريخ: ${targetDate}`);
    
    // فحص جدول Attendances
    currentDb.all(`SELECT * FROM Attendances WHERE date = ? ORDER BY createdAt`, [targetDate], (err, attendanceRecords) => {
      if (err) {
        console.log('❌ خطأ في قراءة جدول Attendances:', err.message);
        currentDb.close();
        resolve();
        return;
      }
      
      console.log(`📊 سجلات الحضور والغياب في ${targetDate}: ${attendanceRecords ? attendanceRecords.length : 0}`);
      
      if (attendanceRecords && attendanceRecords.length > 0) {
        console.log('\n✅ تم العثور على سجلات الحضور والغياب:');
        
        // تجميع السجلات حسب القسم
        const recordsBySection = {};
        attendanceRecords.forEach(record => {
          if (!recordsBySection[record.sectionId]) {
            recordsBySection[record.sectionId] = [];
          }
          recordsBySection[record.sectionId].push(record);
        });
        
        console.log(`📚 الأقسام المتأثرة: ${Object.keys(recordsBySection).length}`);
        
        Object.keys(recordsBySection).forEach(sectionId => {
          const sectionRecords = recordsBySection[sectionId];
          console.log(`\n📖 القسم ${sectionId}:`);
          console.log(`   📈 عدد الطلاب: ${sectionRecords.length}`);
          
          const presentCount = sectionRecords.filter(r => r.status === 'present').length;
          const absentCount = sectionRecords.filter(r => r.status === 'absent').length;
          const lateCount = sectionRecords.filter(r => r.status === 'late').length;
          
          console.log(`   ✅ حاضر: ${presentCount}`);
          console.log(`   ❌ غائب: ${absentCount}`);
          console.log(`   ⏰ متأخر: ${lateCount}`);
          
          // عرض أول 3 سجلات كعينة
          console.log('   📋 عينة من السجلات:');
          sectionRecords.slice(0, 3).forEach((record, index) => {
            console.log(`     ${index + 1}. الطالب ${record.studentId} - ${record.status} - ${record.createdAt}`);
          });
          
          if (sectionRecords.length > 3) {
            console.log(`     ... و ${sectionRecords.length - 3} سجل آخر`);
          }
        });
        
      } else {
        console.log('\n⚠️ لم يتم العثور على سجلات حضور وغياب لهذا التاريخ');
      }
      
      // فحص جميع التواريخ المتاحة في جدول Attendances
      currentDb.all(`SELECT DISTINCT date, COUNT(*) as count FROM Attendances GROUP BY date ORDER BY date DESC`, (err, allDates) => {
        if (err) {
          console.log('❌ خطأ في قراءة جميع التواريخ:', err.message);
        } else {
          console.log('\n📅 جميع تواريخ الحضور والغياب المسجلة:');
          allDates.forEach((dateRecord, index) => {
            const isTarget = dateRecord.date === targetDate;
            const marker = isTarget ? '🎯' : '📅';
            console.log(`   ${marker} ${dateRecord.date}: ${dateRecord.count} سجل`);
          });
        }
        
        currentDb.close();
        resolve();
      });
    });
  });
}

// فحص النسخة الاحتياطية أيضاً
function checkBackupAttendance() {
  return new Promise((resolve) => {
    const backupPath = 'classroom_backup_20250924_174347.db';
    const targetDate = '2025-09-23';
    
    console.log(`\n🔍 فحص النسخة الاحتياطية للتاريخ ${targetDate}:`);
    
    if (!require('fs').existsSync(backupPath)) {
      console.log('❌ ملف النسخة الاحتياطية غير موجود');
      resolve();
      return;
    }
    
    const backupDb = new sqlite3.Database(backupPath, sqlite3.OPEN_READONLY);
    
    backupDb.all(`SELECT * FROM Attendances WHERE date = ? ORDER BY createdAt`, [targetDate], (err, backupRecords) => {
      if (err) {
        console.log('❌ خطأ في قراءة النسخة الاحتياطية:', err.message);
        backupDb.close();
        resolve();
        return;
      }
      
      console.log(`📊 سجلات في النسخة الاحتياطية: ${backupRecords ? backupRecords.length : 0}`);
      
      if (backupRecords && backupRecords.length > 0) {
        console.log('✅ توجد سجلات في النسخة الاحتياطية');
        
        // تجميع حسب القسم
        const recordsBySection = {};
        backupRecords.forEach(record => {
          if (!recordsBySection[record.sectionId]) {
            recordsBySection[record.sectionId] = [];
          }
          recordsBySection[record.sectionId].push(record);
        });
        
        console.log(`📚 الأقسام في النسخة الاحتياطية: ${Object.keys(recordsBySection).length}`);
        Object.keys(recordsBySection).forEach(sectionId => {
          const count = recordsBySection[sectionId].length;
          console.log(`   📖 القسم ${sectionId}: ${count} طالب`);
        });
      } else {
        console.log('⚠️ لا توجد سجلات في النسخة الاحتياطية أيضاً');
      }
      
      backupDb.close();
      resolve();
    });
  });
}

async function runAttendanceInvestigation() {
  console.log('=' .repeat(60));
  await checkAttendanceRecords();
  await checkBackupAttendance();
  console.log('\n' + '='.repeat(60));
  console.log('✅ انتهى فحص سجلات الحضور والغياب');
}

runAttendanceInvestigation().catch(console.error);