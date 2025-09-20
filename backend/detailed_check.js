const sequelize = require('./config/database');
const { Student, Section } = require('./models');

async function detailedStudentCheck() {
  try {
    console.log('🔍 فحص مفصل لبيانات الطلاب...\n');
    
    // فحص أول طالب بالتفصيل
    const firstStudent = await Student.findOne();
    
    if (firstStudent) {
      console.log('📝 بيانات أول طالب:');
      console.log('Raw data:', JSON.stringify(firstStudent.dataValues, null, 2));
      console.log('Available fields:', Object.keys(firstStudent.dataValues));
    } else {
      console.log('❌ لا توجد بيانات طلاب');
      return;
    }
    
    // فحص جدول Students مباشرة من قاعدة البيانات
    console.log('\n📊 فحص مباشر للجدول:');
    const [results] = await sequelize.query('SELECT * FROM Students LIMIT 3');
    console.log('First 3 students from DB:', results);
    
    // فحص schema الجدول
    console.log('\n🏗️ فحص بنية الجدول:');
    const [tableInfo] = await sequelize.query("PRAGMA table_info(Students)");
    console.log('Table structure:', tableInfo);
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await sequelize.close();
  }
}

detailedStudentCheck();