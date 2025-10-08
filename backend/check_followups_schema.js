const sequelize = require('./config/database');

(async () => {
  try {
    const [cols] = await sequelize.query("PRAGMA table_info('FollowUps');");
    console.log('SCHEMA:');
    cols.forEach(c => console.log(`  - ${c.name} (${c.type}) ${c.notnull ? 'NOT NULL' : ''} ${c.dflt_value ? 'DEFAULT=' + c.dflt_value : ''}`));

    const [rows] = await sequelize.query('SELECT * FROM FollowUps LIMIT 5;').catch(e => [{ error: e.message }]);
    console.log('ROWS:');
    console.log(JSON.stringify(rows, null, 2));
  } catch (e) {
    console.error('ERROR:', e.message);
    if (e.stack) console.error(e.stack);
  } finally {
    process.exit(0);
  }
})();
