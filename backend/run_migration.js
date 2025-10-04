const { up, down } = require('./migrations/add_educational_level_to_sections');

async function runMigration() {
  try {
    console.log('Starting migration to add educationalLevel to Sections...');
    await up();
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    console.log('Rolling back changes...');
    try {
      await down();
      console.log('Rollback completed successfully');
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
    }
    process.exit(1);
  }
}

runMigration();