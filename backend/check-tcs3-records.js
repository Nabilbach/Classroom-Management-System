const { Sequelize } = require('sequelize');
const { Attendance, Section, Student, sequelize } = require('./models');

async function checkTCS3Records() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // First, find TCS-3 section
    const tcs3Section = await Section.findOne({
      where: { name: 'TCS-3' }
    });

    if (!tcs3Section) {
      console.log('❌ Section TCS-3 not found!');
      return;
    }

    console.log(`\n📋 Found TCS-3 Section: ID = ${tcs3Section.id}, Name = ${tcs3Section.name}`);

    // Get all students in TCS-3
    const tcs3Students = await Student.findAll({
      where: { sectionId: tcs3Section.id },
      attributes: ['id', 'firstName', 'lastName', 'classOrder'],
      order: [['classOrder', 'ASC'], ['id', 'ASC']]
    });

    console.log(`\n👥 Students in TCS-3: ${tcs3Students.length}`);
    tcs3Students.forEach((student, index) => {
      console.log(`   ${index + 1}. ID=${student.id} | ${student.firstName} ${student.lastName} | Order=${student.classOrder}`);
    });

    // Get all attendance records for TCS-3
    const tcs3Attendance = await Attendance.findAll({
      where: { sectionId: tcs3Section.id },
      include: [{
        model: Student,
        as: 'student',
        attributes: ['firstName', 'lastName', 'classOrder']
      }],
      order: [['date', 'DESC'], ['studentId', 'ASC']]
    });

    console.log(`\n📊 Total attendance records for TCS-3: ${tcs3Attendance.length}`);

    // Group by date
    const recordsByDate = {};
    tcs3Attendance.forEach(record => {
      if (!recordsByDate[record.date]) {
        recordsByDate[record.date] = {
          present: [],
          absent: []
        };
      }
      
      const student = record.student;
      const studentInfo = {
        id: record.studentId,
        name: `${student?.firstName || ''} ${student?.lastName || ''}`.trim(),
        order: student?.classOrder
      };

      if (record.isPresent) {
        recordsByDate[record.date].present.push(studentInfo);
      } else {
        recordsByDate[record.date].absent.push(studentInfo);
      }
    });

    // Display records by date
    const dates = Object.keys(recordsByDate).sort((a, b) => b.localeCompare(a));
    
    console.log(`\n📅 Attendance records by date:`);
    dates.forEach(date => {
      const dayRecords = recordsByDate[date];
      console.log(`\n📅 ${date}:`);
      console.log(`   ✅ Present (${dayRecords.present.length}):`);
      dayRecords.present
        .sort((a, b) => (a.order || 999) - (b.order || 999))
        .forEach(student => {
          console.log(`      ${student.order || '?'}. ${student.name} (ID: ${student.id})`);
        });
      
      console.log(`   ❌ Absent (${dayRecords.absent.length}):`);
      dayRecords.absent
        .sort((a, b) => (a.order || 999) - (b.order || 999))
        .forEach(student => {
          console.log(`      ${student.order || '?'}. ${student.name} (ID: ${student.id})`);
        });
    });

    // Check for students without any records
    const studentsWithRecords = new Set(tcs3Attendance.map(r => r.studentId));
    const studentsWithoutRecords = tcs3Students.filter(s => !studentsWithRecords.has(s.id));

    if (studentsWithoutRecords.length > 0) {
      console.log(`\n⚠️ Students in TCS-3 without ANY attendance records (${studentsWithoutRecords.length}):`);
      studentsWithoutRecords.forEach(student => {
        console.log(`   ${student.classOrder || '?'}. ${student.firstName} ${student.lastName} (ID: ${student.id})`);
      });
    } else {
      console.log(`\n✅ All TCS-3 students have attendance records`);
    }

    // Summary statistics
    console.log(`\n📈 Summary Statistics for TCS-3:`);
    console.log(`   📚 Total students: ${tcs3Students.length}`);
    console.log(`   📊 Total attendance records: ${tcs3Attendance.length}`);
    console.log(`   📅 Dates covered: ${dates.length}`);
    console.log(`   👥 Students with records: ${studentsWithRecords.size}`);
    console.log(`   ⚠️ Students without records: ${studentsWithoutRecords.length}`);

    if (dates.length > 0) {
      const avgRecordsPerDay = (tcs3Attendance.length / dates.length).toFixed(1);
      console.log(`   📊 Average records per day: ${avgRecordsPerDay}`);
    }

    await sequelize.close();
    console.log('\n✅ TCS-3 verification complete.');
  } catch (err) {
    console.error('❌ Verification failed:', err.message);
    console.error(err);
  }
}

checkTCS3Records();