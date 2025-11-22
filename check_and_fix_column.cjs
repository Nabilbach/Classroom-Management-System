const db = require('./backend/models');

async function checkAndFixColumn() {
  try {
    console.log('🔍 فحص هيكل جدول StudentAssessments...\n');
    
    await db.sequelize.authenticate();
    console.log('✅ الاتصال بقاعدة البيانات نجح\n');
    
    // فحص الأعمدة الموجودة
    const [columns] = await db.sequelize.query("PRAGMA table_info(StudentAssessments);");
    console.log('📋 الأعمدة الموجودة حالياً:');
    columns.forEach(col => {
      console.log(`   - ${col.name} (${col.type})`);
    });
    
    // التحقق من وجود العمود
    const hasStudentId = columns.some(col => col.name === 'studentId');
    console.log('\n' + (hasStudentId ? '✅' : '❌') + ' العمود studentId:', hasStudentId ? 'موجود' : 'غير موجود');
    
    // إذا لم يكن موجوداً، أضفه
    if (!hasStudentId) {
      console.log('\n⚙️  إضافة العمود studentId...');
      try {
        await db.sequelize.query(`
          ALTER TABLE StudentAssessments ADD COLUMN student_id INTEGER;
        `);
        console.log('✅ تم إضافة العمود بنجاح');
      } catch (err) {
        // قد يكون العمود موجود بالفعل
        if (err.message.includes('duplicate column name')) {
          console.log('⚠️  العمود موجود بالفعل');
        } else {
          throw err;
        }
      }
    }
    
    // التحقق من البيانات
    console.log('\n📊 فحص البيانات:');
    const [result] = await db.sequelize.query(`
      SELECT COUNT(*) as total FROM StudentAssessments;
    `);
    console.log(`   إجمالي التقييمات: ${result[0].total}`);
    
    console.log('\n✅ تم الفحص بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await db.sequelize.close();
  }
}

checkAndFixColumn();
