const path = require('path');
const { Sequelize } = require('sequelize');

const dbFiles = [
  path.resolve(__dirname, '..', '..', 'classroom.db'),
  path.resolve(__dirname, '..', '..', 'classroom_dev.db'),
  path.resolve(__dirname, '..', '..', 'classroom_test.db'),
  path.resolve(__dirname, '..', '..', 'classroom_backup_safe.db'),
  path.resolve(__dirname, '..', '..', 'classroom_before_restore_2025-09-26T14-53-53-289Z.db'),
  path.resolve(__dirname, '..', '..', 'classroom.before_attendance_fix.2025-09-29.db'),
];

async function inspectDb(file) {
  const sequelize = new Sequelize({ dialect: 'sqlite', storage: file, logging: false });
  try {
    await sequelize.authenticate();
  } catch (e) {
    console.error(`DB: ${file}\n  ERROR connecting: ${e.message}`);
    await sequelize.close();
    return;
  }

  try {
    const [fuRows] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table' AND name='FollowUps';");
    if (fuRows && fuRows.length > 0) {
      const [[{ count }]] = await sequelize.query('SELECT COUNT(1) as count FROM FollowUps');
      console.log(`DB: ${file}\n  FollowUps: ${count}`);
    } else {
      console.log(`DB: ${file}\n  FollowUps: table_missing`);
    }
  } catch (e) {
    console.log(`DB: ${file}\n  FollowUps: error (${e.message})`);
  }

  try {
    const [saRows] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table' AND name='StudentAssessments';");
    if (saRows && saRows.length > 0) {
      const [[{ count }]] = await sequelize.query('SELECT COUNT(1) as count FROM StudentAssessments');
      console.log(`  StudentAssessments: ${count}`);
    } else {
      console.log(`  StudentAssessments: table_missing`);
    }
  } catch (e) {
    console.log(`  StudentAssessments: error (${e.message})`);
  }

  await sequelize.close();
}

(async () => {
  for (const f of dbFiles) {
    await inspectDb(f);
    console.log('---');
  }
})();
