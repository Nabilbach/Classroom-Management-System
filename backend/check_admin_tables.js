const db = require('./models');

async function checkAdminTables() {
  try {
    const [results] = await db.sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%Admin%';"
    );
    console.log('Admin tables:', results);
    
    // Also check if AdminScheduleEntry model works
    try {
      const count = await db.AdminScheduleEntry.count();
      console.log('AdminScheduleEntry table is working. Current count:', count);
    } catch (error) {
      console.error('AdminScheduleEntry model error:', error.message);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAdminTables();