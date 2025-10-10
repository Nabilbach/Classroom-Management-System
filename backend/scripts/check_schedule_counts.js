const path = require('path');
const { Sequelize } = require('sequelize');

async function run() {
  const file = path.resolve(__dirname, '..', '..', 'classroom.db');
  const sequelize = new Sequelize({ dialect: 'sqlite', storage: file, logging: false });
  try {
    await sequelize.authenticate();
    console.log('Connected to', file);

    const tables = ['ScheduledLessons','AdminScheduleEntries','TextbookEntries','Attendances','AdminScheduleEntry','TextbookEntry','ScheduledLesson'];
    for (const t of tables) {
      try {
        const [[{ count }]] = await sequelize.query(`SELECT COUNT(1) as count FROM "${t}"`);
        console.log(`${t}: ${count}`);
      } catch (e) {
        // table probably missing
        try {
          const [rows] = await sequelize.query(`SELECT name FROM sqlite_master WHERE type='table' AND name='${t}'`);
          if (rows && rows.length) console.log(`${t}: present (couldn't count) - ${e.message}`);
          else console.log(`${t}: table_missing`);
        } catch (e2) {
          console.log(`${t}: error (${e2.message})`);
        }
      }
    }
  } catch (e) {
    console.error('Failed to open DB:', e.message);
  } finally {
    await sequelize.close();
  }
}

run().catch(e => console.error(e));
