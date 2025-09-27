const { Attendance, Student, Section } = require('./models');
const { Op } = require('sequelize');

async function investigateData() {
  try {
    console.log('🔍 التحقق من بيانات الحضور الحقيقية...\n');

    // إجمالي السجلات
    const totalRecords = await Attendance.count();
    console.log(`📊 إجمالي سجلات الحضور: ${totalRecords}`);

    // التحقق من التواريخ المختلفة
    const uniqueDates = await Attendance.findAll({
      attributes: ['date'],
      group: ['date'],
      order: [['date', 'ASC']]
    });
    
    console.log(`📅 عدد الأيام المسجلة: ${uniqueDates.length}`);
    console.log('التواريخ المسجلة:');
    uniqueDates.forEach(record => {
      console.log(`   - ${record.date}`);
    });

    // التحقق من الأقسام المختلفة
    const uniqueSections = await Attendance.findAll({
      attributes: ['sectionId'],
      group: ['sectionId'],
      include: [{
        model: Section,
        attributes: ['name', 'educationalLevel']
      }]
    });
    
    console.log(`\n🏫 عدد الأقسام المسجلة: ${uniqueSections.length}`);
    console.log('الأقسام المسجلة:');
    for (let sectionRecord of uniqueSections) {
      const section = await Section.findByPk(sectionRecord.sectionId);
      const count = await Attendance.count({ where: { sectionId: sectionRecord.sectionId } });
      console.log(`   - ${section?.name || sectionRecord.sectionId}: ${count} سجلات`);
    }

    // التحقق من آخر 10 سجلات
    console.log('\n📋 آخر 10 سجلات:');
    const recentRecords = await Attendance.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [{
        model: Student,
        as: 'student',
        attributes: ['firstName', 'lastName']
      }]
    });

    recentRecords.forEach((record, i) => {
      const studentName = record.student ? 
        `${record.student.firstName} ${record.student.lastName}` : 
        `Student ID: ${record.studentId}`;
      console.log(`   ${i+1}. ${studentName} - ${record.date} - ${record.isPresent ? 'حاضر' : 'غائب'} - ${record.sectionId}`);
    });

    // التحقق من البيانات المولدة تلقائياً (من السكريبت)
    const todayGenerated = await Attendance.count({
      where: {
        date: '2025-09-26',
        createdAt: {
          [Op.gte]: new Date('2025-09-26')
        }
      }
    });
    
    console.log(`\n⚠️  السجلات المولدة اليوم (محتمل من السكريبت): ${todayGenerated}`);

    // البحث عن البيانات الحقيقية (الأقدم)
    const oldestRecord = await Attendance.findOne({
      order: [['createdAt', 'ASC']]
    });
    
    const newestRecord = await Attendance.findOne({
      order: [['createdAt', 'DESC']]
    });

    if (oldestRecord && newestRecord) {
      console.log(`\n🕒 أقدم سجل: ${oldestRecord.createdAt} (${oldestRecord.date})`);
      console.log(`🕒 أحدث سجل: ${newestRecord.createdAt} (${newestRecord.date})`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ في التحقق:', error);
    process.exit(1);
  }
}

investigateData();