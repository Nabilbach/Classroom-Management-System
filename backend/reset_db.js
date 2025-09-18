const db = require('./models');

const resetDatabase = async () => {
  console.log('Starting database reset...');
  try {
    console.log('Dropping all tables...');
    await db.sequelize.drop();
    console.log('All tables dropped.');

    console.log('Re-synchronizing database...');
    await db.sequelize.sync();
    console.log('Database re-synchronized successfully.');

    console.log('Database reset complete.');
  } catch (error) {
    console.error('Failed to reset database:', error);
  } finally {
    await db.sequelize.close();
    console.log('Database connection closed.');
  }
};

resetDatabase();
