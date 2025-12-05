const db = require('./backend/models');

async function findTheRoot() {
  console.log('='.repeat(70));
  console.log('🔍 البحث عن جذر المشكلة - التقرير النهائي');
  console.log('='.repeat(70));
  
  try {
    await db.sequelize.authenticate();
    
    // المشكلة الرئيسية
    console.log('\n❌ المشكلة المكتشفة:');
    console.log('   عند إنشاء الجدول، تم تعريف العمود باسم "studentId" (camelCase)');
    console.log('   ولكن Sequelize يحول هذا إلى "studentId" في قاعدة البيانات');
    console.log('   والاستعلامات التقليدية تتوقع "student_id" (snake_case)');
    
    // اختبار الاتصال بالاسم الصحيح
    console.log('\n✅ اختبار الاتصال بالاسم الصحيح:');
    const [joinTest] = await db.sequelize.query(`
      SELECT 
        s.id,
        s.first_name,
        COUNT(a.id) as assessments_count
      FROM Students s
      LEFT JOIN StudentAssessments a ON s.id = a.studentId
      GROUP BY s.id
      LIMIT 5;
    `);
    
    console.log('   ✅ الاتصال نجح! نتائج:');
    let totalStudents = 0;
    let totalAssessments = 0;
    joinTest.forEach(row => {
      console.log(`      Student ID ${row.id} (${row.first_name}): ${row.assessments_count} تقييم`);
      totalStudents++;
      totalAssessments += row.assessments_count;
    });

    // إحصائيات شاملة
    console.log('\n📊 إحصائيات شاملة:');
    const [stats] = await db.sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM Students) as total_students,
        (SELECT COUNT(*) FROM StudentAssessments) as total_assessments,
        (SELECT COUNT(DISTINCT studentId) FROM StudentAssessments) as unique_students_in_assessments
    ;`);
    
    const s = stats[0];
    console.log(`   📍 إجمالي الطلاب: ${s.total_students}`);
    console.log(`   📍 إجمالي التقييمات: ${s.total_assessments}`);
    console.log(`   📍 الطلاب ذوو التقييمات: ${s.unique_students_in_assessments}`);
    console.log(`   📍 نسبة الغطاء: ${((s.unique_students_in_assessments / s.total_students) * 100).toFixed(2)}%`);
    
    // الطلاب بدون تقييمات
    console.log('\n⚠️  الطلاب بدون تقييمات:');
    const [noAssessments] = await db.sequelize.query(`
      SELECT 
        COUNT(*) as count,
        (SELECT COUNT(*) FROM Students) as total
      FROM Students s
      WHERE s.id NOT IN (SELECT DISTINCT studentId FROM StudentAssessments);
    `);
    const noAss = noAssessments[0];
    console.log(`   عدد الطلاب بدون تقييمات: ${noAss.count} من ${noAss.total} (${((noAss.count / noAss.total) * 100).toFixed(2)}%)`);

    // عينة من الطلاب بدون تقييمات
    console.log('\n📋 عينة من الطلاب بدون تقييمات:');
    const [noAssSample] = await db.sequelize.query(`
      SELECT id, first_name, last_name, section_id
      FROM Students s
      WHERE s.id NOT IN (SELECT DISTINCT studentId FROM StudentAssessments)
      LIMIT 5;
    `);
    noAssSample.forEach(st => {
      console.log(`      - ${st.first_name} ${st.last_name} (ID: ${st.id}, القسم: ${st.section_id})`);
    });

    // الأقسام والبيانات
    console.log('\n🏫 توزيع البيانات على الأقسام:');
    const [sectionData] = await db.sequelize.query(`
      SELECT 
        s.section_id,
        COUNT(DISTINCT s.id) as students_count,
        COUNT(DISTINCT a.studentId) as students_with_assessments,
        COUNT(a.id) as assessments_count
      FROM Students s
      LEFT JOIN StudentAssessments a ON s.id = a.studentId
      GROUP BY s.section_id
      ORDER BY students_count DESC;
    `);
    
    sectionData.forEach(row => {
      const sectionName = row.section_id || 'بدون قسم';
      const coverage = row.students_count > 0 ? ((row.students_with_assessments / row.students_count) * 100).toFixed(1) : '0';
      console.log(`      القسم ${sectionName}:`);
      console.log(`         - الطلاب: ${row.students_count}`);
      console.log(`         - الطلاب ذوو التقييمات: ${row.students_with_assessments} (${coverage}%)`);
      console.log(`         - التقييمات: ${row.assessments_count}`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('✅ تم تحديد المشكلة بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await db.sequelize.close();
  }
}

findTheRoot();
