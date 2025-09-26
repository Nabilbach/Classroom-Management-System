const sqlite3 = require('sqlite3');
const fs = require('fs');
const path = require('path');

async function searchAllDbs() {
  console.log('🔍 البحث عن السجلات الحقيقية في جميع قواعد البيانات...');
  
  const projectRoot = path.dirname(__dirname);
  const files = fs.readdirSync(projectRoot).filter(f => f.endsWith('.db'));
  
  for (const file of files) {
    const dbPath = path.join(projectRoot, file);
    console.log(`\n📁 فحص: ${file}`);
    
    const db = new sqlite3.Database(dbPath);
    
    // Check both Attendance and Attendances tables
    for (const tableName of ['Attendance', 'Attendances']) {
      try {
        const tableExists = await new Promise((resolve) => {
          db.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [tableName], (err, row) => {
            resolve(!!row);
          });
        });
        
        if (!tableExists) continue;
        
        const records25 = await new Promise((resolve, reject) => {
          db.get(`SELECT COUNT(*) as count FROM ${tableName} WHERE date='2025-09-25'`, (err, row) => {
            if (err) reject(err);
            else resolve(row.count);
          });
        });
        
        const records26 = await new Promise((resolve, reject) => {
          db.get(`SELECT COUNT(*) as count FROM ${tableName} WHERE date='2025-09-26'`, (err, row) => {
            if (err) reject(err);
            else resolve(row.count);
          });
        });
        
        if (records25 > 0 || records26 > 0) {
          console.log(`  ✅ ${tableName}: 25 سبتمبر=${records25}, 26 سبتمبر=${records26}`);
          
          // Get sample records to see what's inside
          const samples = await new Promise((resolve, reject) => {
            db.all(`SELECT * FROM ${tableName} WHERE date IN ('2025-09-25', '2025-09-26') ORDER BY date, studentId LIMIT 5`, (err, rows) => {
              if (err) reject(err);
              else resolve(rows || []);
            });
          });
          
          if (samples.length > 0) {
            console.log('    عينة من السجلات:');
            samples.forEach(s => {
              const present = s.isPresent !== undefined ? s.isPresent : s.status;
              console.log(`    - studentId=${s.studentId}, sectionId=${s.sectionId}, date=${s.date}, present=${present}`);
            });
            
            // Check if there are more students for these dates in this DB
            const totalStudents = await new Promise((resolve, reject) => {
              db.get(`SELECT COUNT(DISTINCT studentId) as count FROM ${tableName} WHERE date IN ('2025-09-25', '2025-09-26')`, (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
              });
            });
            console.log(`    إجمالي الطلاب المميزين: ${totalStudents}`);
          }
        }
        
      } catch (e) {
        console.log(`  ❌ خطأ في ${tableName}: ${e.message}`);
      }
    }
    
    await new Promise(resolve => db.close(resolve));
  }
}

if (require.main === module) {
  searchAllDbs()
    .then(() => {
      console.log('\n✅ انتهى البحث');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ خطأ:', err);
      process.exit(1);
    });
}

module.exports = { searchAllDbs };