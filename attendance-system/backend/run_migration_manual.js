const path = require('path');
const sequelize = require('./config/database');
const Sequelize = require('sequelize');

(async () => {
  try {
    const migration = require(path.join(__dirname, 'migrations', '20251007-add-subject-to-users.js'));
    const queryInterface = sequelize.getQueryInterface();
    console.log('Running manual migration: 20251007-add-subject-to-users.js');
    await migration.up(queryInterface, Sequelize);
    console.log('Migration applied. Describing Users table:');
    const desc = await queryInterface.describeTable('Users');
    console.log(desc);
    process.exit(0);
  } catch (e) {
    console.error('Migration failed:', e);
    process.exit(1);
  }
})();
