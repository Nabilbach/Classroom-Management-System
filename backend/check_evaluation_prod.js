const { Sequelize } = require('sequelize');
const path = require('path');

async function checkTables() {
  try {
    const sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, '..', 'classroom.db'),
      logging: false,
    });
    
    console.log('=== جداول قاعدة البيانات في الإنتاج ===');
    
    const [results] = await sequelize.query("SELECT name FROM sqlite_master WHERE type = 'table'");
    
    const evaluationTables = results.filter(t => t.name.toLowerCase().includes('evaluation'));
    
    console.log('جداول التقييم:', evaluationTables.map(t => t.name));
    console.log('جميع الجداول:', results.map(t => t.name));
    
    await sequelize.close();
  } catch (error) {
    console.error('خطأ:', error.message);
  }
}

checkTables();