(async () => {
  try {
    const db = require('./models');
    await db.sequelize.authenticate();
    
    const sections = await db.Section.findAll();
    console.log('\n=== Sections in Database ===\n');
    sections.forEach(s => {
      const j = s.toJSON();
      console.log(`ID: ${j.id}`);
      console.log(`Name: ${j.name}`);
      console.log(`Level: ${j.educationalLevel || 'N/A'}`);
      console.log('---');
    });
    
    console.log(`\nTotal: ${sections.length} sections`);
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
