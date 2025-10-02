const { Sequelize } = require('sequelize');
const path = require('path');

async function inspect(dbPath) {
  try {
    const sequelize = new Sequelize({ dialect: 'sqlite', storage: dbPath, logging: false });
    await sequelize.authenticate();
    const tables = ['Sections','Students','StudentAssessments','FollowUps','Attendances'];
    const res = { dbPath };
    for (const t of tables) {
      try {
        const [[{ count }]] = await sequelize.query("SELECT COUNT(name) as count FROM sqlite_master WHERE type='table' AND name=?", { replacements:[t] });
        res[`${t}_exists`] = Number(count || 0) > 0;
        if (res[`${t}_exists`]) {
          const [[{ c }]] = await sequelize.query(`SELECT COUNT(1) as c FROM ${t}`);
          res[`${t}_count`] = Number(c || 0);
          if (res[`${t}_count`] > 0) {
            const [rows] = await sequelize.query(`SELECT * FROM ${t} LIMIT 5`);
            res[`${t}_sample`] = rows;
          } else {
            res[`${t}_sample`] = [];
          }
        } else {
          res[`${t}_count`] = 0;
          res[`${t}_sample`] = [];
        }
      } catch (e) {
        res[`${t}_error`] = e.message;
      }
    }
    await sequelize.close();
    return res;
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
    const r = await inspect(p);
    console.log('\n---- ' + p + '\n');
    console.log(JSON.stringify(r, null, 2));
  }
})();
