const { Sequelize } = require('sequelize');
const { Attendance, Section, Student, sequelize } = require('./models');

async function verify() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    const total = await Attendance.count();
    console.log(`\n📦 Total attendance records: ${total}`);

    const distinctDates = await Attendance.findAll({
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('date')), 'date']
      ],
      order: [['date', 'ASC']],
      raw: true
    });
    console.log(`🗓️  Dates covered (${distinctDates.length}):`, distinctDates.map(d => d.date).join(', '));

    const bySection = await Attendance.findAll({
      attributes: [
        'sectionId',
        [sequelize.fn('COUNT', sequelize.col('Attendance.id')), 'count']
      ],
      include: [{
        model: Section,
        attributes: ['name']
      }],
      group: ['sectionId', 'Section.id', 'Section.name'],
      order: [[sequelize.literal('count'), 'DESC']],
      raw: true
    });

    console.log('\n📊 Records by section:');
    bySection.forEach(rec => {
      const label = rec['Section.name'] || rec.sectionId;
      console.log(`- ${label}: ${rec.count}`);
    });

    const latest = await Attendance.findAll({
      limit: 10,
      order: [['date', 'DESC'], ['updatedAt', 'DESC']],
      include: [{
        model: Student,
        as: 'student',
        attributes: [['first_name', 'firstName'], ['last_name', 'lastName'], 'sectionId']
      }]
    });

    console.log('\n📝 Latest records (10):');
    latest.forEach(rec => {
      const student = rec.student;
      const name = student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : 'Unknown';
      console.log(`- ${rec.date} | studentId=${rec.studentId} (${name}) | section=${rec.sectionId} | present=${rec.isPresent}`);
    });

    const missingStudents = await Student.findAll({
      include: [{
        model: Attendance,
        required: false
      }],
      where: {
        '$Attendances.id$': null
      },
      attributes: [['first_name', 'firstName'], ['last_name', 'lastName'], 'sectionId'],
      raw: true
    });

    console.log(`\n👥 Students without any attendance records: ${missingStudents.length}`);

    await sequelize.close();
    console.log('\n✅ Verification complete.');
  } catch (err) {
    console.error('❌ Verification failed:', err.message);
  }
}

verify();
