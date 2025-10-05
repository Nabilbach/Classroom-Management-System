const bcrypt = require('bcrypt');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

(async () => {
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'attendance.db'),
    logging: false
  });

  const User = sequelize.define('User', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fullName: {
      type: DataTypes.STRING
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'teacher'
    }
  });

  try {
    await sequelize.sync();
    
    // حذف المستخدم admin إن وُجد
    await User.destroy({ where: { username: 'admin' } });
    
    const hashed = await bcrypt.hash('admin123', 10);
    await User.create({
      id: Date.now().toString(),
      username: 'admin',
      password: hashed,
      fullName: 'مدير النظام',
      role: 'admin'
    });

    console.log('✅ تم إنشاء حساب المدير بنجاح!');
    console.log('   اسم المستخدم: admin');
    console.log('   كلمة المرور: admin123');
    
    // التحقق
    const [users] = await sequelize.query('SELECT id, username, role FROM Users');
    console.log('\n📋 المستخدمون الحاليون:', JSON.stringify(users, null, 2));
    
  } catch (err) {
    console.error('❌ خطأ:', err.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
})();
