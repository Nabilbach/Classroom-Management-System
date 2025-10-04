const db = require('./models');

(async () => {
  try {
    const [[row]] = await db.sequelize.query("SELECT sql FROM sqlite_master WHERE type='table' AND name='FollowUps'");
    console.log('Create SQL for FollowUps:\n', row.sql);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();