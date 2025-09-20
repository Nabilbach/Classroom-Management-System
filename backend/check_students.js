const sequelize = require('./config/database');
const { Student, Section } = require('./models');

async function checkStudentsData() {
  try {
    console.log('🔍 فحص بيانات الطلاب...\n');
    
    // إحصاء إجمالي الطلاب
    const totalStudents = await Student.count();
    console.log(`📊 إجمالي عدد الطلاب: ${totalStudents}`);
    
    if (totalStudents === 0) {
      console.log('❌ لا توجد بيانات طلاب في قاعدة البيانات');
      return;
    }
    
    // إحصاء الأقسام
    const totalSections = await Section.count();
    console.log(`📚 إجمالي عدد الأقسام: ${totalSections}`);
    
    // عرض الطلاب حسب القسم
    const sections = await Section.findAll({
      include: [{
        model: Student,
        as: 'Students'
      }]
    });
    
    console.log('\n📋 توزيع الطلاب حسب الأقسام:');
    sections.forEach(section => {
      console.log(`  - ${section.name}: ${section.Students.length} طالب`);
    });
    
    // عرض أول 5 طلاب كعينة
    console.log('\n👥 عينة من الطلاب (أول 5):');
    const sampleStudents = await Student.findAll({
      limit: 5,
      include: [{
        model: Section,
        as: 'Section',
        attributes: ['name']
      }]
    });
    
    sampleStudents.forEach(student => {
      console.log(`  - ${student.firstName} ${student.lastName} (${student.Section ? student.Section.name : 'بدون قسم'})`);
    });
    
  } catch (error) {
    console.error('❌ خطأ في فحص البيانات:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkStudentsData();