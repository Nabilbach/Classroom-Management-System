const db = require('./models');

async function addSampleAttendanceData() {
  try {
    console.log('🔄 إضافة بيانات حضور تجريبية...');

    // جلب بعض الطلاب والأقسام الموجودة
    const students = await db.Student.findAll({ limit: 10 });
    const sections = await db.Section.findAll({ limit: 3 });

    if (students.length === 0 || sections.length === 0) {
      console.log('❌ لا توجد طلاب أو أقسام في قاعدة البيانات');
      return;
    }

    console.log(`📚 وُجد ${students.length} طلاب و ${sections.length} أقسام`);

    // إضافة سجلات حضور لآخر 7 أيام
    const attendanceRecords = [];
    
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date();
      date.setDate(date.getDate() - dayOffset);
      const dateStr = date.toISOString().split('T')[0];
      
      for (const student of students) {
        // نسبة حضور عشوائية واقعية (80-95%)
        const isPresent = Math.random() > 0.15; // 85% احتمال الحضور
        
        attendanceRecords.push({
          studentId: student.id,
          sectionId: student.sectionId || sections[0].id,
          date: dateStr,
          isPresent: isPresent
        });
      }
    }

    // حذف السجلات الموجودة لتجنب التكرار
    await db.Attendance.destroy({
      where: {
        date: {
          [db.Sequelize.Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      }
    });

    // إدراج السجلات الجديدة
    await db.Attendance.bulkCreate(attendanceRecords);

    console.log(`✅ تم إضافة ${attendanceRecords.length} سجل حضور`);

    // عرض إحصائيات سريعة
    const totalRecords = await db.Attendance.count();
    const presentCount = await db.Attendance.count({ where: { isPresent: true } });
    const attendanceRate = Math.round((presentCount / totalRecords) * 100);

    console.log(`📊 إجمالي السجلات: ${totalRecords}`);
    console.log(`👥 الحاضرون: ${presentCount}`);
    console.log(`📈 معدل الحضور: ${attendanceRate}%`);

    // عرض عينة من البيانات
    const sampleRecords = await db.Attendance.findAll({
      limit: 5,
      include: [{
        model: db.Student,
        as: 'student',
        attributes: ['firstName', 'lastName']
      }],
      order: [['date', 'DESC']]
    });

    console.log('\n📝 عينة من السجلات الأحدث:');
    sampleRecords.forEach(record => {
      console.log(`- ${record.date}: ${record.student?.firstName} ${record.student?.lastName} - ${record.isPresent ? '✅ حاضر' : '❌ غائب'}`);
    });

    console.log('\n🎉 تم إنشاء البيانات التجريبية بنجاح!');
    console.log('💡 يمكنك الآن رؤية الإحصائيات والمخططات في صفحة التقارير');

  } catch (error) {
    console.error('❌ خطأ في إضافة البيانات التجريبية:', error);
  } finally {
    process.exit(0);
  }
}

// تشغيل الدالة
addSampleAttendanceData();