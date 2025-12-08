const path = require('path');
// Force development environment and DB path
process.env.NODE_ENV = 'development';
process.env.DB_PATH = 'classroom_dev.db';

const { sequelize, Curriculum, CurriculumItem } = require('../backend/models');

async function syncTables() {
  try {
    console.log('🔄 Syncing Curriculum tables to classroom_dev.db...');
    
    // Sync only the new models
    await Curriculum.sync({ alter: true });
    await CurriculumItem.sync({ alter: true });
    
    console.log('✅ Curriculum tables synced successfully!');
    
    // Verify tables exist
    const tables = await sequelize.getQueryInterface().showAllSchemas();
    console.log('📊 Current tables in DB:', tables);

  } catch (error) {
    console.error('❌ Error syncing tables:', error);
  } finally {
    await sequelize.close();
  }
}

syncTables();
