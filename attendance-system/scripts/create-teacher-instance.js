const path = require('path');
const fs = require('fs-extra');
const sqlite3 = require('sqlite3').verbose();
const inquirer = require('inquirer');
const bcrypt = require('bcrypt');

const CENTRAL_DB_PATH = path.join(__dirname, '..', 'attendance-central.db');
const TEMPLATE_PATH = path.join(__dirname, '..'); // مجلد النظام الجديد

async function createTeacherInstance() {
  const centralDb = new sqlite3.Database(CENTRAL_DB_PATH);

  // 1. إدخال اسم المستخدم وكلمة المرور فقط
  const answers = await inquirer.prompt([
    { type: 'input', name: 'username', message: 'اسم المستخدم للأستاذ:', validate: input => input.length >= 3 ? true : 'يجب أن يكون اسم المستخدم 3 أحرف على الأقل' },
    { type: 'password', name: 'password', message: 'كلمة المرور للأستاذ:', validate: input => input.length >= 6 ? true : 'يجب أن تكون كلمة المرور 6 أحرف على الأقل' },
    { type: 'input', name: 'outputFolder', message: 'مسار المجلد لحفظ نسخة الأستاذ:', default: './teacher-instances' }
  ]);

  // 2. جلب بيانات المدرس من Users
  const teacherRow = await new Promise((resolve, reject) => {
    centralDb.get(`SELECT * FROM Users WHERE username = ? AND role = 'teacher'`, [answers.username], (err, row) => {
      if (err) reject(err);
      else if (!row) reject(new Error('لم يتم العثور على المدرس بهذا الاسم'));
      else resolve(row);
    });
  });
  const teacherId = teacherRow.id;
  const fullName = teacherRow.fullName;

  // 3. التحقق من كلمة المرور
  const passwordMatch = await bcrypt.compare(answers.password, teacherRow.password);
  if (!passwordMatch) {
    throw new Error('كلمة المرور غير صحيحة');
  }

  // 4. جلب الأقسام المسندة للمدرس
  const assignedSectionIds = await new Promise((resolve, reject) => {
    centralDb.all(`SELECT sectionId FROM TeacherSections WHERE teacherId = ?`, [teacherId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map(r => r.sectionId));
    });
  });
  if (!assignedSectionIds.length) {
    throw new Error('لا توجد أقسام مسندة لهذا المدرس');
  }

  // 5. إنشاء مجلد نسخة الأستاذ
  const teacherFolder = path.join(answers.outputFolder, answers.username);
  fs.ensureDirSync(teacherFolder);
  await fs.copy(TEMPLATE_PATH, teacherFolder, {
    filter: src => !src.includes('teacher-instances') && !src.includes('attendance-central.db')
  });

  // 6. إنشاء قاعدة بيانات الأستاذ المحلية
  const teacherDbPath = path.join(teacherFolder, 'attendance-local.db');
  const teacherDb = new sqlite3.Database(teacherDbPath);

  teacherDb.serialize(() => {
    teacherDb.run(`CREATE TABLE User (
      id TEXT PRIMARY KEY,
      username TEXT,
      password TEXT,
      fullName TEXT,
      centralServerUrl TEXT DEFAULT 'http://localhost:4001'
    )`);
    teacherDb.run(`INSERT INTO User VALUES (?, ?, ?, ?, ?)`, [teacherId, answers.username, '', fullName, 'http://localhost:4001']);
    teacherDb.run(`CREATE TABLE Sections (
      id TEXT PRIMARY KEY,
      name TEXT,
      educationalLevel TEXT
    )`);
    teacherDb.run(`CREATE TABLE Students (
      id INTEGER PRIMARY KEY,
      first_name TEXT,
      last_name TEXT,
      section_id TEXT,
      class_order INTEGER
    )`);
    teacherDb.run(`CREATE TABLE Attendances (
      id INTEGER PRIMARY KEY,
      studentId INTEGER,
      sectionId TEXT,
      date TEXT,
      isPresent INTEGER,
      createdAt TEXT,
      updatedAt TEXT,
      syncedToServer INTEGER DEFAULT 0
    )`);
    teacherDb.run(`CREATE TABLE SyncLog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT,
      timestamp TEXT,
      details TEXT
    )`);
    teacherDb.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_attendance_student_date ON Attendances (studentId, date)`);
  });

  // 7. نقل الصفوف والطلاب
  centralDb.all(
    `SELECT * FROM Sections WHERE id IN (${assignedSectionIds.map(() => '?').join(',')})`,
    assignedSectionIds,
    (err, sections) => {
      if (err) { console.error('خطأ في جلب الصفوف:', err); return; }
      const stmt = teacherDb.prepare(`INSERT INTO Sections VALUES (?, ?, ?)`);
      sections.forEach(section => {
        stmt.run(section.id, section.name, section.educationalLevel);
      });
      stmt.finalize();
      centralDb.all(
        `SELECT * FROM Students WHERE section_id IN (${assignedSectionIds.map(() => '?').join(',')})`,
        assignedSectionIds,
        (err, students) => {
          if (err) { console.error('خطأ في جلب الطلاب:', err); return; }
          const stmt = teacherDb.prepare(`INSERT INTO Students VALUES (?, ?, ?, ?, ?)`);
          students.forEach(student => {
            stmt.run(student.id, student.first_name, student.last_name, student.section_id, student.class_order);
          });
          stmt.finalize();
          console.log(`تم إنشاء نسخة للأستاذ ${fullName} بنجاح!`);
          console.log(`- المسار: ${teacherFolder}`);
          console.log(`- عدد الصفوف: ${sections.length}`);
          console.log(`- عدد الطلاب: ${students.length}`);
          console.log(`\nيمكن تشغيل النظام بالأمر التالي:`);
          console.log(`cd ${teacherFolder} && npm start`);
          centralDb.close();
          teacherDb.close();
        }
      );
    }
  );
}

createTeacherInstance().catch(console.error);
