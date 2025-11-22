const db = require('./backend/models');
const path = require('path');
const fs = require('fs');

async function checkDatabaseHealth() {
  console.log('='.repeat(60));
  console.log('فحص شامل لصحة قاعدة البيانات');
  console.log('='.repeat(60));
  
  try {
    // 1. فحص وجود ملف قاعدة البيانات
    const dbPath = path.join(__dirname, 'classroom.db');
    console.log('\n1️⃣ فحص ملف قاعدة البيانات:');
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      console.log('   ✅ الملف موجود:', dbPath);
      console.log('   📊 الحجم:', (stats.size / 1024).toFixed(2), 'KB');
      console.log('   📅 آخر تعديل:', stats.mtime.toLocaleString('ar-SA'));
    } else {
      console.log('   ❌ الملف غير موجود!');
      return;
    }

    // 2. فحص الاتصال بقاعدة البيانات
    console.log('\n2️⃣ فحص الاتصال بقاعدة البيانات:');
    try {
      await db.sequelize.authenticate();
      console.log('   ✅ الاتصال نجح');
    } catch (err) {
      console.log('   ❌ الاتصال فشل:', err.message);
      return;
    }

    // 3. فحص الجداول
    console.log('\n3️⃣ فحص الجداول الموجودة:');
    const [tables] = await db.sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
    );
    
    if (tables.length === 0) {
      console.log('   ⚠️  لا توجد جداول في قاعدة البيانات!');
    } else {
      console.log('   ✅ عدد الجداول:', tables.length);
      tables.forEach((t, i) => {
        console.log(`      ${i + 1}. ${t.name}`);
      });
    }

    // 4. فحص بيانات كل جدول
    console.log('\n4️⃣ فحص عدد السجلات في كل جدول:');
    
    const importantTables = [
      'Students',
      'Sections',
      'StudentAssessments',
      'Attendances',
      'Lessons',
      'ScheduledLessons'
    ];
    
    for (const tableName of importantTables) {
      try {
        const [result] = await db.sequelize.query(
          `SELECT COUNT(*) as count FROM ${tableName};`
        );
        const count = result[0].count;
        const status = count > 0 ? '✅' : '⚠️';
        console.log(`   ${status} ${tableName}: ${count} سجل`);
      } catch (err) {
        console.log(`   ❌ ${tableName}: جدول غير موجود`);
      }
    }

    // 5. فحص Students بالتفصيل
    console.log('\n5️⃣ فحص تفاصيل جدول Students:');
    try {
      const students = await db.Student.findAll({ 
        limit: 5,
        attributes: ['id', 'firstName', 'lastName', 'pathwayNumber', 'classOrder', 'sectionId']
      });
      
      if (students.length > 0) {
        console.log(`   ✅ عدد الطلاب: ${await db.Student.count()}`);
        console.log('   📋 أول 5 طلاب:');
        students.forEach(s => {
          console.log(`      - ${s.firstName} ${s.lastName} (رقم المسار: ${s.pathwayNumber})`);
        });
      } else {
        console.log('   ⚠️  لا توجد بيانات في جدول Students');
      }
    } catch (err) {
      console.log('   ❌ خطأ في فحص Students:', err.message);
    }

    // 6. فحص النوابع (Foreign Keys)
    console.log('\n6️⃣ فحص العلاقات والنوابع:');
    try {
      const [fkList] = await db.sequelize.query("PRAGMA foreign_key_list(Students);");
      if (fkList.length > 0) {
        console.log('   ✅ العلاقات الموجودة:');
        fkList.forEach(fk => {
          console.log(`      - ${fk.from} → ${fk.table}.${fk.to}`);
        });
      } else {
        console.log('   ⚠️  لا توجد علاقات محددة في جدول Students');
      }
    } catch (err) {
      console.log('   ⚠️  خطأ في فحص العلاقات:', err.message);
    }

    // 7. فحص سجلات مفقودة
    console.log('\n7️⃣ فحص السجلات المفقودة:');
    try {
      const [nullSectionIds] = await db.sequelize.query(
        "SELECT COUNT(*) as count FROM Students WHERE section_id IS NULL;"
      );
      const nullCount = nullSectionIds[0].count;
      
      const [nullStudentIds] = await db.sequelize.query(
        "SELECT COUNT(*) as count FROM StudentAssessments WHERE student_id IS NULL;"
      );
      const nullStudentCount = nullStudentIds[0].count;
      
      console.log(`   ${nullCount > 0 ? '⚠️' : '✅'} طلاب بدون قسم: ${nullCount}`);
      console.log(`   ${nullStudentCount > 0 ? '⚠️' : '✅'} تقييمات بدون طالب: ${nullStudentCount}`);
    } catch (err) {
      console.log('   ❌ خطأ:', err.message);
    }

    // 8. فحص السعة والأداء
    console.log('\n8️⃣ معلومات الأداء:');
    try {
      const [pragma] = await db.sequelize.query('PRAGMA page_count;');
      const pages = pragma[0].page_count;
      console.log(`   📊 عدد الصفحات: ${pages}`);
      
      const [size] = await db.sequelize.query('PRAGMA page_size;');
      const pageSize = size[0].page_size;
      console.log(`   📏 حجم الصفحة: ${pageSize} bytes`);
      
      const totalSize = pages * pageSize / 1024;
      console.log(`   💾 الحجم الإجمالي المستخدم: ${totalSize.toFixed(2)} KB`);
    } catch (err) {
      console.log('   ⚠️  خطأ:', err.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ انتهى الفحص');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
  } finally {
    await db.sequelize.close();
  }
}

checkDatabaseHealth();
