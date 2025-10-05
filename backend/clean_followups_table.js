(async () => {
  try {
    const db = require('./models');
    await db.sequelize.authenticate();
    
    console.log('\n=== Cleaning Duplicate Timestamp Columns ===\n');
    
    // Check if duplicate columns exist
    const [columns] = await db.sequelize.query("PRAGMA table_info('FollowUps');");
    const hasCreatedAt = columns.some(col => col.name === 'createdAt');
    const hasUpdatedAt = columns.some(col => col.name === 'updatedAt');
    
    if (hasCreatedAt || hasUpdatedAt) {
      console.log('Found duplicate timestamp columns. Creating clean table...\n');
      
      await db.sequelize.transaction(async (t) => {
        // Create new table with correct schema
        await db.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "FollowUps_new" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "student_id" INTEGER NOT NULL,
            "section_id" VARCHAR(255),
            "type" VARCHAR(255) NOT NULL,
            "notes" TEXT,
            "is_open" TINYINT(1) NOT NULL DEFAULT 1,
            "created_at" DATETIME NOT NULL,
            "updated_at" DATETIME NOT NULL
          );
        `, { transaction: t });
        
        // Copy data from old to new
        await db.sequelize.query(`
          INSERT INTO "FollowUps_new" 
            (id, student_id, section_id, type, notes, is_open, created_at, updated_at)
          SELECT 
            id, 
            student_id, 
            section_id, 
            type, 
            notes, 
            is_open,
            COALESCE(created_at, createdAt, datetime('now')),
            COALESCE(updated_at, updatedAt, datetime('now'))
          FROM "FollowUps";
        `, { transaction: t });
        
        // Drop old table and rename new
        await db.sequelize.query('DROP TABLE "FollowUps";', { transaction: t });
        await db.sequelize.query('ALTER TABLE "FollowUps_new" RENAME TO "FollowUps";', { transaction: t });
      });
      
      console.log('✅ Table cleaned successfully');
    } else {
      console.log('✅ No duplicate columns found');
    }
    
    // Verify final structure
    console.log('\n=== Final Table Structure ===\n');
    const [finalCols] = await db.sequelize.query("PRAGMA table_info('FollowUps');");
    finalCols.forEach(col => {
      console.log(`  - ${col.name} (${col.type})`);
    });
    
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
