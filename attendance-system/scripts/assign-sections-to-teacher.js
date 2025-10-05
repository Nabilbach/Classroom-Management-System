const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const inquirer = require('inquirer');

const CENTRAL_DB_PATH = path.join(__dirname, '..', 'attendance-central.db');
const centralDb = new sqlite3.Database(CENTRAL_DB_PATH);

async function assignSectionsToTeacher() {
  // جلب الأساتذة
  const users = await new Promise((resolve, reject) => {
    centralDb.all(`SELECT id, username, fullName FROM Users WHERE role = 'teacher'`, [], (err, rows) => {
      if (err) reject(err); else resolve(rows);
    });
  });
  if (users.length === 0) {
    console.log('لا يوجد أساتذة في النظام المركزي.');
    process.exit(0);
  }

  // جلب الأقسام
  const sections = await new Promise((resolve, reject) => {
    centralDb.all(`SELECT id, name FROM Sections`, [], (err, rows) => {
      if (err) reject(err); else resolve(rows);
    });
  });
  if (sections.length === 0) {
    console.log('لا يوجد أقسام في النظام المركزي.');
    process.exit(0);
  }

  // اختيار الأستاذ
  const { teacherId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'teacherId',
      message: 'اختر الأستاذ لإسناد الأقسام له:',
      choices: users.map(u => ({ name: `${u.fullName} (${u.username})`, value: u.id }))
    }
  ]);

  // اختيار الأقسام
  const { assignedSections } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'assignedSections',
      message: 'اختر الأقسام التي سيدرسها الأستاذ:',
      choices: sections.map(s => ({ name: s.name, value: s.id }))
    }
  ]);

  // إسناد الأقسام للأستاذ
  const stmt = centralDb.prepare(`INSERT OR IGNORE INTO TeacherSections (teacherId, sectionId) VALUES (?, ?)`);
  for (const sectionId of assignedSections) {
    await new Promise((resolve, reject) => {
      stmt.run([teacherId, sectionId], err => { if (err) reject(err); else resolve(); });
    });
  }
  stmt.finalize();

  console.log('تم إسناد الأقسام للأستاذ بنجاح!');
  centralDb.close();
}

assignSectionsToTeacher();
