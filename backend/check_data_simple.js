const { Section, Student } = require('./models');

async function checkData() {
  try {
    console.log('🔍 فحص البيانات...\n');
    
    // فحص الأقسام
    const sections = await Section.findAll();
    console.log('📚 الأقسام المتاحة:');
    sections.forEach(s => console.log(`  - ID: ${s.id}, Name: ${s.name}`));
    
    // فحص الطلاب والأقسام المرتبطة بهم
    const students = await Student.findAll({ limit: 5 });
    console.log('\n👥 عينة من الطلاب:');
    students.forEach(s => console.log(`  - ${s.firstName} ${s.lastName} (Section ID: ${s.sectionId})`));
    
    // فحص إجمالي الطلاب
    const totalStudents = await Student.count();
    console.log(`\n📊 إجمالي الطلاب: ${totalStudents}`);
    
    // فحص الطلاب في القسم الأول
    const studentsInSection1 = await Student.findAll({ where: { sectionId: 1 } });
    console.log(`\n🔸 طلاب في القسم ID=1: ${studentsInSection1.length}`);
    
    // فحص الطلاب بدون قسم
    const studentsWithoutSection = await Student.findAll({ where: { sectionId: null } });
    console.log(`🔸 طلاب بدون قسم: ${studentsWithoutSection.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  }
}

checkData();