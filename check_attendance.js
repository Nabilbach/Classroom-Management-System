const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// مسار قاعدة البيانات
const dbPath = path.resolve(__dirname, 'classroom.db');

console.log('📁 Database path:', dbPath);
console.log('🔍 فحص سجلات الحضور والغياب...\n');

// فتح قاعدة البيانات
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err);
    process.exit(1);
  }
  console.log('✅ تم الاتصال بقاعدة البيانات\n');
});

// فحص الجداول المتعلقة بالحضور
async function checkAttendanceTables() {
  return new Promise((resolve, reject) => {
    console.log('=== الجداول الموجودة في قاعدة البيانات ===');
    
    db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `, (err, tables) => {
      if (err) {
        reject(err);
        return;
      }
      
      tables.forEach(table => {
        console.log(`- ${table.name}`);
      });
      
      console.log('\n=== الجداول المتعلقة بالحضور ===');
      const attendanceTables = tables.filter(t => 
        t.name.toLowerCase().includes('attendance') || 
        t.name.toLowerCase().includes('absent') ||
        t.name.toLowerCase().includes('غياب') ||
        t.name.toLowerCase().includes('حضور')
      );
      
      if (attendanceTables.length > 0) {
        attendanceTables.forEach(table => {
          console.log(`✅ ${table.name}`);
        });
      } else {
        console.log('⚠️ لا توجد جداول حضور مباشرة');
      }
      
      resolve();
    });
  });
}

// فحص بنية جدول Attendances
async function checkAttendanceStructure() {
  return new Promise((resolve, reject) => {
    console.log('\n=== بنية جدول Attendances ===');
    
    db.all(`PRAGMA table_info(Attendances)`, (err, columns) => {
      if (err) {
        console.log('❌ جدول Attendances غير موجود');
        resolve();
        return;
      }
      
      if (columns.length === 0) {
        console.log('❌ جدول Attendances فارغ أو غير موجود');
        resolve();
        return;
      }
      
      console.log('أعمدة جدول Attendances:');
      columns.forEach(col => {
        console.log(`  - ${col.name}: ${col.type} ${col.notnull ? '(مطلوب)' : '(اختياري)'}`);
      });
      
      resolve();
    });
  });
}

// عد السجلات في جدول Attendances
async function countAttendanceRecords() {
  return new Promise((resolve, reject) => {
    console.log('\n=== إحصائيات سجلات الحضور ===');
    
    db.get(`SELECT COUNT(*) as total FROM Attendances`, (err, row) => {
      if (err) {
        console.log('❌ خطأ في عد السجلات:', err.message);
        resolve();
        return;
      }
      
      console.log(`📊 إجمالي سجلات الحضور: ${row.total}`);
      
      if (row.total > 0) {
        // إحصائيات مفصلة
        db.all(`
          SELECT 
            status,
            COUNT(*) as count,
            ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM Attendances), 2) as percentage
          FROM Attendances 
          GROUP BY status
          ORDER BY count DESC
        `, (err, stats) => {
          if (!err && stats.length > 0) {
            console.log('\n📈 توزيع حالات الحضور:');
            stats.forEach(stat => {
              const statusText = stat.status === 'present' ? 'حاضر' : 
                                stat.status === 'absent' ? 'غائب' : 
                                stat.status === 'late' ? 'متأخر' : stat.status;
              console.log(`  ${statusText}: ${stat.count} سجل (${stat.percentage}%)`);
            });
          }
          
          // آخر السجلات
          db.all(`
            SELECT 
              s.firstName || ' ' || s.lastName as studentName,
              sec.name as sectionName,
              a.date,
              a.status
            FROM Attendances a
            JOIN Students s ON a.studentId = s.id
            JOIN Sections sec ON a.sectionId = sec.id
            ORDER BY a.date DESC, a.id DESC
            LIMIT 10
          `, (err, recent) => {
            if (!err && recent.length > 0) {
              console.log('\n🕐 آخر 10 سجلات حضور:');
              recent.forEach(record => {
                const statusText = record.status === 'present' ? '✅ حاضر' : 
                                  record.status === 'absent' ? '❌ غائب' : 
                                  record.status === 'late' ? '⏰ متأخر' : record.status;
                console.log(`  ${record.studentName} (${record.sectionName}) - ${record.date} - ${statusText}`);
              });
            }
            resolve();
          });
        });
      } else {
        resolve();
      }
    });
  });
}

// فحص سجلات الحضور حسب الأقسام
async function checkAttendanceBySection() {
  return new Promise((resolve, reject) => {
    console.log('\n=== الحضور حسب الأقسام ===');
    
    db.all(`
      SELECT 
        sec.name as sectionName,
        COUNT(a.id) as totalRecords,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as presentCount,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absentCount,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as lateCount
      FROM Sections sec
      LEFT JOIN Attendances a ON sec.id = a.sectionId
      GROUP BY sec.id, sec.name
      HAVING totalRecords > 0
      ORDER BY totalRecords DESC
    `, (err, sections) => {
      if (err) {
        console.log('❌ خطأ في جلب إحصائيات الأقسام:', err.message);
        resolve();
        return;
      }
      
      if (sections.length === 0) {
        console.log('⚠️ لا توجد سجلات حضور مرتبطة بأقسام');
        resolve();
        return;
      }
      
      sections.forEach(section => {
        console.log(`\n📚 ${section.sectionName}:`);
        console.log(`  إجمالي السجلات: ${section.totalRecords}`);
        console.log(`  حاضر: ${section.presentCount}`);
        console.log(`  غائب: ${section.absentCount}`);
        console.log(`  متأخر: ${section.lateCount}`);
        
        if (section.totalRecords > 0) {
          const attendanceRate = ((section.presentCount + section.lateCount) / section.totalRecords * 100).toFixed(1);
          console.log(`  معدل الحضور: ${attendanceRate}%`);
        }
      });
      
      resolve();
    });
  });
}

// تشغيل جميع الفحوصات
async function runAllChecks() {
  try {
    await checkAttendanceTables();
    await checkAttendanceStructure();
    await countAttendanceRecords();
    await checkAttendanceBySection();
    
    console.log('\n✅ تم انتهاء الفحص');
  } catch (error) {
    console.error('❌ خطأ في الفحص:', error);
  } finally {
    db.close();
  }
}

// بدء الفحص
runAllChecks();