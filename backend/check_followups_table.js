(async () => {
  try {
    const db = require('./models');
    await db.sequelize.authenticate();
    
    console.log('\n=== Checking FollowUps Table Structure ===\n');
    
    const [columns] = await db.sequelize.query("PRAGMA table_info('FollowUps');");
    console.log('Columns:');
    columns.forEach(col => {
      console.log(`  - ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : 'NULL'} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
    });
    
    // Try to create a test followup
    console.log('\n=== Testing FollowUp Creation ===\n');
    try {
      const testFollowup = await db.FollowUp.create({
        studentId: 344,
        type: 'test',
        description: 'Test followup',
        is_open: true
      });
      console.log('✅ Test followup created successfully:', testFollowup.toJSON());
      
      // Delete test followup
      await testFollowup.destroy();
      console.log('✅ Test followup deleted');
    } catch (e) {
      console.error('❌ Error creating test followup:', e.message);
      console.error('Full error:', e);
    }
    
    process.exit(0);
  } catch (e) {
    console.error('Fatal error:', e);
    process.exit(1);
  }
})();
