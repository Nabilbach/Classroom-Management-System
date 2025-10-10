const { Sequelize } = require('sequelize');
const path = require('path');

async function checkDb(dbPath) {
  try {
    const sequelize = new Sequelize({ dialect: 'sqlite', storage: dbPath, logging: false });
    await sequelize.authenticate();
    // Check tables exist
    const [[{ count: hasSections }]] = await sequelize.query("SELECT COUNT(name) as count FROM sqlite_master WHERE type='table' AND name='Sections'");
    const [[{ count: hasStudents }]] = await sequelize.query("SELECT COUNT(name) as count FROM sqlite_master WHERE type='table' AND name='Students'");
    let sectionCount = 0, studentCount = 0;
    if (hasSections) {
      const [[{ c }]] = await sequelize.query('SELECT COUNT(1) as c FROM Sections');
      sectionCount = Number(c || 0);
    }
    if (hasStudents) {
      const [[{ c }]] = await sequelize.query('SELECT COUNT(1) as c FROM Students');
      studentCount = Number(c || 0);
    }
    await sequelize.close();
    return { dbPath, hasSections: !!hasSections, hasStudents: !!hasStudents, sectionCount, studentCount };
  } catch (e) {
    return { dbPath, error: e.message };
  }
}

(async () => {
  const candidates = [
    path.join(__dirname, '..', 'classroom.db'),
    path.join(__dirname, '..', 'classroom_dev.db'),
    path.join(__dirname, '..', 'classroom_test.db'),
    path.join(__dirname, '..', 'classroom_backup_safe.db'),
    path.join(__dirname, '..', 'classroom_before_restore_2025-09-26T14-53-53-289Z.db'),
    path.join(__dirname, '..', 'classroom.before_attendance_fix.2025-09-29.db'),
  ];

  for (const p of candidates) {
    const res = await checkDb(p);
    console.log(JSON.stringify(res));
  }
})();
