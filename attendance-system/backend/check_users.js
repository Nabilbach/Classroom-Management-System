const { Sequelize } = require('sequelize');
const path = require('path');

(async () => {
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'attendance.db'),
    logging: false
  });

  try {
    const [users] = await sequelize.query('SELECT id, username, role, fullName FROM Users');
    console.log('📋 المستخدمون في attendance.db:');
    console.log(JSON.stringify(users, null, 2));
    
    if (users.length === 0) {
      console.log('\n⚠️ لا يوجد مستخدمون في قاعدة البيانات!');
    }
  } catch (err) {
    console.error('❌ خطأ:', err.message);
  } finally {
    await sequelize.close();
  }
})();
