const db = require('./models');

async function inspect() {
  try {
    const [cols] = await db.sequelize.query("PRAGMA table_info('FollowUps');");
    console.log('Columns:', cols);
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

inspect();