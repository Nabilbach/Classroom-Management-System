const db = require('./backend/models');
const path = require('path');
const fs = require('fs');

async function diagnoseDataProblem() {
  console.log('='.repeat(70));
  console.log('تشخيص مشكلة البيانات المفقودة - تقرير مفصل');
  console.log('='.repeat(70));
  
  try {
    await db.sequelize.authenticate();
    
    // 1. فحص هيكل جدول StudentAssessments
    console.log('\n1️⃣ فحص هيكل جدول StudentAssessments:');
    const [columns] = await db.sequelize.query("PRAGMA table_info(StudentAssessments);");
    console.log('   الأعمدة الموجودة:');
    columns.forEach(col => {
      console.log(`      - ${col.name} (${col.type}${col.notnull ? ', NOT NULL' : ''})`);
    });

    // 2. فحص هيكل جدول Students
    console.log('\n2️⃣ فحص هيكل جدول Students:');
    const [studCols] = await db.sequelize.query("PRAGMA table_info(Students);");
    console.log('   الأعمدة الموجودة:');
    studCols.forEach(col => {
      console.log(`      - ${col.name} (${col.type}${col.notnull ? ', NOT NULL' : ''})`);
    });

    // 3. فحص البيانات الفعلية
    console.log('\n3️⃣ عينة من بيانات StudentAssessments:');
    const [samples] = await db.sequelize.query(
      `SELECT * FROM StudentAssessments LIMIT 3;`
    );
    console.log('   عدد الأعمدة المرجعة:', Object.keys(samples[0] || {}).length);
    console.log('   الأعمدة:', Object.keys(samples[0] || {}).join(', '));
    samples.forEach((s, i) => {
      console.log(`   \n   السجل ${i + 1}:`);
      Object.entries(s).forEach(([key, val]) => {
        console.log(`      ${key}: ${val}`);
      });
    });

    // 4. فحص Students والعلاقات
    console.log('\n4️⃣ فحص Students والعلاقات:');
    const [studentSamples] = await db.sequelize.query(
      `SELECT id, first_name, last_name, section_id FROM Students LIMIT 3;`
    );
    console.log('   عينة من الطلاب:');
    studentSamples.forEach(s => {
      console.log(`      - ID: ${s.id}, الاسم: ${s.first_name} ${s.last_name}, القسم: ${s.section_id}`);
    });

    // 5. فحص الاتصال بين الجداول
    console.log('\n5️⃣ فحص الاتصال بين الجداول:');
    const [joinTest] = await db.sequelize.query(`
      SELECT 
        s.id,
        s.first_name,
        COUNT(a.id) as assessments_count
      FROM Students s
      LEFT JOIN StudentAssessments a ON s.id = a.student_id
      GROUP BY s.id
      LIMIT 5;
    `);
    
    console.log('   اختبار الربط (Join):');
    joinTest.forEach(row => {
      console.log(`      Student ID ${row.id} (${row.first_name}): ${row.assessments_count} تقييم`);
    });

    // 6. فحص المشاكل المحتملة
    console.log('\n6️⃣ تحليل المشاكل المحتملة:');
    
    // مشكلة أ: الأعمدة غير الصحيحة
    console.log('   أ. فحص اسم العمود (student_id vs studentId):');
    const [testQuery] = await db.sequelize.query(
      `SELECT sql FROM sqlite_master WHERE type='table' AND name='StudentAssessments';`
    );
    if (testQuery[0]) {
      console.log('      CREATE TABLE SQL:');
      console.log('      ' + testQuery[0].sql);
    }

    // مشكلة ب: البيانات المفقودة
    console.log('\n   ب. فحص البيانات المفقودة:');
    const [stats] = await db.sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM Students) as total_students,
        (SELECT COUNT(*) FROM StudentAssessments) as total_assessments,
        (SELECT COUNT(DISTINCT student_id) FROM StudentAssessments) as unique_students_in_assessments
    ;`);
    console.log(`      إجمالي الطلاب: ${stats[0].total_students}`);
    console.log(`      إجمالي التقييمات: ${stats[0].total_assessments}`);
    console.log(`      الطلاب ذوو التقييمات: ${stats[0].unique_students_in_assessments}`);
    console.log(`      نسبة الغطاء: ${((stats[0].unique_students_in_assessments / stats[0].total_students) * 100).toFixed(2)}%`);

    // مشكلة ج: الأقسام
    console.log('\n   ج. فحص توزيع الطلاب على الأقسام:');
    const [sectionDist] = await db.sequelize.query(`
      SELECT section_id, COUNT(*) as count 
      FROM Students 
      GROUP BY section_id
      ORDER BY count DESC;
    `);
    sectionDist.forEach(row => {
      console.log(`      القسم ${row.section_id}: ${row.count} طالب`);
    });

    // 7. فحص التقييمات الحديثة
    console.log('\n7️⃣ فحص آخر التقييمات:');
    const [recent] = await db.sequelize.query(`
      SELECT * FROM StudentAssessments 
      ORDER BY createdAt DESC 
      LIMIT 3;
    `);
    recent.forEach((r, i) => {
      console.log(`   التقييم ${i + 1}:`);
      console.log(`      - Student ID: ${r.student_id}`);
      console.log(`      - التاريخ: ${r.date || r.createdAt}`);
      console.log(`      - الدرجة الجديدة: ${r.new_score}`);
    });

    // 8. فحص الملفات الاحتياطية
    console.log('\n8️⃣ فحص الملفات الاحتياطية:');
    const backupDir = path.join(__dirname, 'automated_backups');
    if (fs.existsSync(backupDir)) {
      const backups = fs.readdirSync(backupDir)
        .filter(f => f.endsWith('.db'))
        .sort()
        .slice(-3);
      console.log(`   آخر 3 نسخ احتياطية:`);
      backups.forEach(b => {
        const filePath = path.join(backupDir, b);
        const stat = fs.statSync(filePath);
        console.log(`      - ${b} (${(stat.size / 1024).toFixed(2)} KB) - ${stat.mtime.toLocaleString('ar-SA')}`);
      });
    }

    console.log('\n' + '='.repeat(70));
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    console.error(error.stack);
  } finally {
    await db.sequelize.close();
  }
}

diagnoseDataProblem();
