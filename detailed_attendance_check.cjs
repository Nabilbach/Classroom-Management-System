const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// مسار قاعدة البيانات
const dbPath = path.resolve(__dirname, 'classroom.db');

console.log('📊 فحص تفصيلي لسجلات الحضور والغياب\n');

// فتح قاعدة البيانات
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err);
    process.exit(1);
  }
});

// فحص تفصيلي لسجلات الحضور
async function detailedAttendanceCheck() {
  return new Promise((resolve) => {
    console.log('=== تحليل مفصل لسجلات الحضور ===');
    
    // إجمالي السجلات
    db.get(`SELECT COUNT(*) as total FROM Attendances`, (err, row) => {
      if (err) {
        console.log('❌ خطأ في عد السجلات:', err.message);
        resolve();
        return;
      }
      
      console.log(`📊 إجمالي سجلات الحضور: ${row.total}`);
      
      if (row.total === 0) {
        console.log('⚠️ لا توجد سجلات حضور في قاعدة البيانات');
        resolve();
        return;
      }
      
      // تحليل حالات الحضور (isPresent)
      db.all(`
        SELECT 
          isPresent,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / ${row.total}, 2) as percentage
        FROM Attendances 
        GROUP BY isPresent
        ORDER BY count DESC
      `, (err, stats) => {
        if (!err) {
          console.log('\n📈 توزيع حالات الحضور والغياب:');
          stats.forEach(stat => {
            const statusText = stat.isPresent === 1 ? '✅ حاضر' : '❌ غائب';
            console.log(`  ${statusText}: ${stat.count} سجل (${stat.percentage}%)`);
          });
        }
        
        // السجلات حسب التاريخ
        db.all(`
          SELECT 
            date,
            COUNT(*) as total_records,
            COUNT(CASE WHEN isPresent = 1 THEN 1 END) as present_count,
            COUNT(CASE WHEN isPresent = 0 THEN 1 END) as absent_count
          FROM Attendances 
          GROUP BY date
          ORDER BY date DESC
          LIMIT 10
        `, (err, dateStats) => {
          if (!err && dateStats.length > 0) {
            console.log('\n📅 آخر 10 أيام دراسية مسجلة:');
            dateStats.forEach(day => {
              const attendanceRate = ((day.present_count / day.total_records) * 100).toFixed(1);
              console.log(`  ${day.date}: ${day.present_count} حاضر، ${day.absent_count} غائب (معدل الحضور: ${attendanceRate}%)`);
            });
          }
          
          // السجلات حسب الأقسام
          db.all(`
            SELECT 
              sec.name as sectionName,
              COUNT(a.id) as totalRecords,
              COUNT(CASE WHEN a.isPresent = 1 THEN 1 END) as presentCount,
              COUNT(CASE WHEN a.isPresent = 0 THEN 1 END) as absentCount
            FROM Attendances a
            JOIN Sections sec ON a.sectionId = sec.id
            GROUP BY sec.id, sec.name
            ORDER BY totalRecords DESC
          `, (err, sections) => {
            if (!err && sections.length > 0) {
              console.log('\n📚 إحصائيات الحضور حسب الأقسام:');
              sections.forEach(section => {
                const attendanceRate = section.totalRecords > 0 ? 
                  ((section.presentCount / section.totalRecords) * 100).toFixed(1) : '0';
                console.log(`\n  ${section.sectionName}:`);
                console.log(`    إجمالي السجلات: ${section.totalRecords}`);
                console.log(`    حاضر: ${section.presentCount}`);
                console.log(`    غائب: ${section.absentCount}`);
                console.log(`    معدل الحضور: ${attendanceRate}%`);
              });
            }
            
            // عينة من السجلات الحديثة
            db.all(`
              SELECT 
                s.firstName || ' ' || s.lastName as studentName,
                sec.name as sectionName,
                a.date,
                CASE WHEN a.isPresent = 1 THEN 'حاضر' ELSE 'غائب' END as status,
                a.createdAt
              FROM Attendances a
              JOIN Students s ON a.studentId = s.id
              JOIN Sections sec ON a.sectionId = sec.id
              ORDER BY a.createdAt DESC
              LIMIT 15
            `, (err, recent) => {
              if (!err && recent.length > 0) {
                console.log('\n🕐 آخر 15 سجل حضور:');
                recent.forEach((record, index) => {
                  const statusIcon = record.status === 'حاضر' ? '✅' : '❌';
                  console.log(`  ${index + 1}. ${record.studentName} (${record.sectionName}) - ${record.date} - ${statusIcon} ${record.status}`);
                });
              }
              
              // الطلاب الأكثر غياباً
              db.all(`
                SELECT 
                  s.firstName || ' ' || s.lastName as studentName,
                  sec.name as sectionName,
                  COUNT(a.id) as totalRecords,
                  COUNT(CASE WHEN a.isPresent = 0 THEN 1 END) as absentCount,
                  ROUND(COUNT(CASE WHEN a.isPresent = 0 THEN 1 END) * 100.0 / COUNT(a.id), 2) as absentRate
                FROM Attendances a
                JOIN Students s ON a.studentId = s.id
                JOIN Sections sec ON a.sectionId = sec.id
                GROUP BY s.id, s.firstName, s.lastName, sec.name
                HAVING absentCount > 0
                ORDER BY absentRate DESC, absentCount DESC
                LIMIT 10
              `, (err, absentees) => {
                if (!err && absentees.length > 0) {
                  console.log('\n⚠️ الطلاب الأكثر غياباً:');
                  absentees.forEach((student, index) => {
                    console.log(`  ${index + 1}. ${student.studentName} (${student.sectionName}): ${student.absentCount} غياب من ${student.totalRecords} (${student.absentRate}%)`);
                  });
                }
                resolve();
              });
            });
          });
        });
      });
    });
  });
}

// تشغيل الفحص
detailedAttendanceCheck()
  .then(() => {
    console.log('\n✅ تم انتهاء الفحص التفصيلي');
    db.close();
  })
  .catch((error) => {
    console.error('❌ خطأ في الفحص:', error);
    db.close();
  });