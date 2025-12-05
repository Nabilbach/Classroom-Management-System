const db = require('./backend/models');

console.log('🔍 === فحص قوالب الدروس عبر Sequelize ===\n');

async function checkLessonTemplates() {
  try {
    // تزامن قاعدة البيانات أولاً
    await db.sequelize.sync();
    
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    
    // فحص عدد قوالب الدروس
    const count = await db.LessonTemplate.count();
    console.log(`📚 إجمالي قوالب الدروس (Sequelize): ${count}`);
    
    if (count > 0) {
      // عرض أول 10 قوالب
      const templates = await db.LessonTemplate.findAll({
        attributes: ['id', 'title', 'weekNumber', 'courseName', 'level'],
        order: [['weekNumber', 'ASC']],
        limit: 10
      });
      
      console.log('\n📋 أول 10 قوالب دروس:');
      console.log('=' .repeat(70));
      
      templates.forEach((template, index) => {
        console.log(`${String(index + 1).padStart(2, '0')}. [${template.id}] الأسبوع ${template.weekNumber || 'غير محدد'}: ${template.title}`);
        console.log(`    المقرر: ${template.courseName || 'غير محدد'} | المستوى: ${template.level || 'غير محدد'}`);
        console.log('');
      });
      
      // فحص التوزيع حسب الأسبوع
      const weekDistribution = await db.sequelize.query(`
        SELECT weekNumber, COUNT(*) as count 
        FROM LessonTemplates 
        WHERE weekNumber IS NOT NULL 
        GROUP BY weekNumber 
        ORDER BY weekNumber
      `, { type: db.sequelize.QueryTypes.SELECT });
      
      console.log('📊 توزيع القوالب حسب الأسبوع:');
      weekDistribution.forEach(item => {
        console.log(`   الأسبوع ${item.weekNumber}: ${item.count} قالب`);
      });
      
      // فحص المقررات المختلفة
      const courses = await db.sequelize.query(`
        SELECT courseName, COUNT(*) as count 
        FROM LessonTemplates 
        WHERE courseName IS NOT NULL 
        GROUP BY courseName
      `, { type: db.sequelize.QueryTypes.SELECT });
      
      console.log('\n📚 المقررات الموجودة:');
      courses.forEach(course => {
        console.log(`   ${course.courseName}: ${course.count} قالب`);
      });
    }
    
    console.log('\n🔍 === مقارنة مع الجدول المباشر ===');
    
    // فحص الجدول المباشر أيضاً
    const directCount = await db.sequelize.query(
      'SELECT COUNT(*) as count FROM LessonTemplates',
      { type: db.sequelize.QueryTypes.SELECT }
    );
    
    console.log(`📊 العدد المباشر من الجدول: ${directCount[0].count}`);
    
    if (count !== directCount[0].count) {
      console.log('⚠️  تحذير: هناك تباين بين عدد Sequelize والجدول المباشر!');
    }
    
  } catch (error) {
    console.error('❌ خطأ في الاتصال أو الاستعلام:', error.message);
    console.error('تفاصيل الخطأ:', error);
  } finally {
    // إغلاق الاتصال
    await db.sequelize.close();
  }
}

checkLessonTemplates();