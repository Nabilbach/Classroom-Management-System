const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const XLSX = require('xlsx');
const fs = require('fs');

const CENTRAL_DB_PATH = path.join(__dirname, '..', 'attendance-central.db');
const STUDENTS_FILE = path.join(__dirname, '..', 'students.xlsx'); // غيّر المسار حسب الملف الفعلي

const centralDb = new sqlite3.Database(CENTRAL_DB_PATH);

function importStudents() {
  if (!fs.existsSync(STUDENTS_FILE)) {
    console.error('ملف الطلاب غير موجود:', STUDENTS_FILE);
    process.exit(1);
  }

  const workbook = XLSX.readFile(STUDENTS_FILE);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  // استخراج الأقسام الفريدة
  const sectionsMap = {};
  rows.forEach(row => {
    const sectionName = String(row.section || row.section_name || row.class || '').trim();
    if (sectionName && !sectionsMap[sectionName]) {
      sectionsMap[sectionName] = {
        id: 'section_' + Object.keys(sectionsMap).length + 1,
        name: sectionName,
        educationalLevel: row.level || row.educationalLevel || ''
      };
    }
  });
  const sections = Object.values(sectionsMap);

  centralDb.serialize(() => {
    // إنشاء جدول الأقسام
    centralDb.run(`CREATE TABLE IF NOT EXISTS Sections (
      id TEXT PRIMARY KEY,
      name TEXT,
      educationalLevel TEXT
    )`);
    // إضافة الأقسام
    const sectionStmt = centralDb.prepare(`INSERT OR IGNORE INTO Sections (id, name, educationalLevel) VALUES (?, ?, ?)`);
    sections.forEach(section => {
      sectionStmt.run(section.id, section.name, section.educationalLevel);
    });
    sectionStmt.finalize();

    // إنشاء جدول الطلاب
    centralDb.run(`CREATE TABLE IF NOT EXISTS Students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT,
      last_name TEXT,
      section_id TEXT,
      class_order INTEGER
    )`);
    // إضافة الطلاب
    const studentStmt = centralDb.prepare(`INSERT INTO Students (first_name, last_name, section_id, class_order) VALUES (?, ?, ?, ?)`);
    rows.forEach((row, idx) => {
      const sectionName = String(row.section || row.section_name || row.class || '').trim();
      const section = sectionsMap[sectionName];
      if (section) {
        studentStmt.run(
          row.first_name || row.name || '',
          row.last_name || '',
          section.id,
          row.class_order || idx + 1
        );
      }
    });
    studentStmt.finalize();

    console.log('تم استيراد الأقسام والطلاب بنجاح!');
    centralDb.close();
  });
}

importStudents();
