const sqlite3 = require('sqlite3').verbose();

// فحص بيئة الإنتاج
const dbProd = new sqlite3.Database('../classroom.db');
console.log('=== بيئة الإنتاج ===');

dbProd.all("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%Evaluation%'", (err, rows) => {
  if (err) {
    console.log('Error:', err);
  } else {
    console.log('جداول التقييم:', rows.map(r => r.name));
  }
  
  dbProd.close();
  
  // فحص بيئة التطوير
  const dbDev = new sqlite3.Database('../../Classroom Management System - Development/classroom.db');
  console.log('=== بيئة التطوير ===');
  
  dbDev.all("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%Evaluation%'", (err, rows) => {
    if (err) {
      console.log('Error:', err);
    } else {
      console.log('جداول التقييم:', rows.map(r => r.name));
    }
    dbDev.close();
  });
});