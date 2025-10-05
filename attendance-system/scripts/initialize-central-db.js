const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const bcrypt = require('bcrypt');

const ORIGINAL_DB_PATH = path.join(__dirname, '..', '..', 'classroom.db');
const CENTRAL_DB_PATH = path.join(__dirname, '..', 'attendance-central.db');

if (fs.existsSync(CENTRAL_DB_PATH)) {
  fs.unlinkSync(CENTRAL_DB_PATH);
}

const originalDb = new sqlite3.Database(ORIGINAL_DB_PATH);
const centralDb = new sqlite3.Database(CENTRAL_DB_PATH);

console.log('بدء تهيئة قاعدة البيانات المركزية...');

centralDb.serialize(() => {
  // جدول المستخدمين
  centralDb.run(`CREATE TABLE Users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    fullName TEXT,
    role TEXT DEFAULT 'teacher'
  )`);

  // جدول TeacherSections
  centralDb.run(`CREATE TABLE TeacherSections (
    teacherId TEXT,
    sectionId TEXT,
    PRIMARY KEY (teacherId, sectionId)
  )`);

  // نقل جدول Sections
  originalDb.all(`SELECT * FROM Sections`, [], (err, sections) => {
    if (err) {
      console.error('خطأ في قراءة الصفوف:', err);
      return;
    }
    centralDb.run(`CREATE TABLE Sections (
      id TEXT PRIMARY KEY,
      name TEXT,
      educationalLevel TEXT
    )`);
    const stmt = centralDb.prepare(`INSERT INTO Sections VALUES (?, ?, ?)`);
    sections.forEach(section => {
      stmt.run(section.id, section.name, section.educationalLevel);
    });
    stmt.finalize();
    console.log(`تم نقل ${sections.length} صف بنجاح`);
  });

  // نقل جدول Students
  originalDb.all(`SELECT id, first_name, last_name, section_id, class_order FROM Students`, [], (err, students) => {
    if (err) {
      console.error('خطأ في قراءة الطلاب:', err);
      return;
    }
    centralDb.run(`CREATE TABLE Students (
      id INTEGER PRIMARY KEY,
      first_name TEXT,
      last_name TEXT,
      section_id TEXT,
      class_order INTEGER
    )`);
    const stmt = centralDb.prepare(`INSERT INTO Students VALUES (?, ?, ?, ?, ?)`);
    students.forEach(student => {
      stmt.run(
        student.id,
        student.first_name,
        student.last_name,
        student.section_id,
        student.class_order
      );
    });
    stmt.finalize();
    console.log(`تم نقل ${students.length} طالب بنجاح`);
  });

  // نقل جدول Attendances
  originalDb.all(`SELECT * FROM Attendances`, [], (err, attendances) => {
    if (err) {
      console.error('خطأ في قراءة سجلات الحضور:', err);
      return;
    }
    centralDb.run(`CREATE TABLE Attendances (
      id INTEGER PRIMARY KEY,
      studentId INTEGER,
      sectionId TEXT,
      date TEXT,
      isPresent INTEGER,
      createdAt TEXT,
      updatedAt TEXT
    )`);
    const stmt = centralDb.prepare(`INSERT INTO Attendances VALUES (?, ?, ?, ?, ?, ?, ?)`);
    attendances.forEach(attendance => {
      stmt.run(
        attendance.id,
        attendance.studentId,
        attendance.sectionId,
        attendance.date,
        attendance.isPresent,
        attendance.createdAt || new Date().toISOString(),
        attendance.updatedAt || new Date().toISOString()
      );
    });
    stmt.finalize();
    console.log(`تم نقل ${attendances.length} سجل حضور بنجاح`);
  });

  // إنشاء مستخدم إداري افتراضي
  bcrypt.hash('admin123', 10, (err, hash) => {
    if (err) {
      console.error('خطأ في تشفير كلمة المرور:', err);
      return;
    }
    centralDb.run(`INSERT INTO Users (id, username, password, fullName, role) VALUES (?, ?, ?, ?, ?)`,
      ['admin_' + Date.now(), 'admin', hash, 'مدير النظام', 'admin'],
      function(err) {
        if (err) {
          console.error('خطأ في إنشاء المستخدم الإداري:', err);
        } else {
          console.log('تم إنشاء المستخدم الإداري بنجاح');
        }
      }
    );
  });
});

originalDb.close();

centralDb.serialize(() => {
  centralDb.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_attendance_student_date ON Attendances (studentId, date)`,
    function(err) {
      if (err) {
        console.error('خطأ في إنشاء الفهرس الفريد للحضور:', err);
      } else {
        console.log('تم إنشاء فهرس الحضور بنجاح');
      }
      centralDb.close();
      console.log('اكتملت تهيئة قاعدة البيانات المركزية');
    }
  );
});
