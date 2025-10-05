(async () => {
  try {
    const db = require('./models');
    await db.sequelize.authenticate();
    
    const entries = await db.TextbookEntry.findAll({ limit: 5 });
    console.log('\n=== Sample TextbookEntries ===\n');
    entries.forEach(e => {
      const j = e.toJSON();
      console.log(`ID: ${j.id}`);
      console.log(`Section ID: ${j.sectionId}`);
      console.log(`Section Name: ${j.sectionName}`);
      console.log(`Date: ${j.date}`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
