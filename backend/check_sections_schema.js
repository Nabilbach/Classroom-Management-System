const db = require('./models');

(async () => {
  try {
    const [cols] = await db.sequelize.query("PRAGMA table_info('Sections')");
    console.log('Sections table columns:');
    cols.forEach(c => {
      console.log(`  - ${c.name} : ${c.type} (nullable: ${c.notnull === 0})`);
    });
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
