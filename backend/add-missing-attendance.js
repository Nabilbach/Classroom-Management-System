const { Attendance, Student } = require('./models');

async function addMissingAttendance() {
  try {
    console.log('🔍 البحث عن الطلاب المفقودين من سجلات الحضور...');
    
    const sectionId = '1758447797026'; // 1BACSH-2
    const dates = ['2025-09-25', '2025-09-26'];
    
    // Get all students in the section
    const allStudents = await Student.findAll({
      where: { section_id: sectionId },
      order: [['classOrder', 'ASC']]
    });
    
    console.log(`📊 إجمالي طلاب القسم: ${allStudents.length}`);
    
    let addedCount = 0;
    
    for (const date of dates) {
      console.log(`\n📅 معالجة تاريخ: ${date}`);
      
      // Get existing attendance for this date
      const existing = await Attendance.findAll({
        where: { date, sectionId }
      });
      
      const existingStudentIds = existing.map(att => att.studentId);
      console.log(`✅ سجلات موجودة: ${existing.length}`);
      
      // Find missing students
      const missingStudents = allStudents.filter(s => !existingStudentIds.includes(s.id));
      console.log(`❌ طلاب مفقودين: ${missingStudents.length}`);
      
      if (missingStudents.length === 0) {
        console.log('✨ لا يوجد طلاب مفقودين لهذا التاريخ');
        continue;
      }
      
      // Add attendance records for missing students (defaulting to present: true)
      const newRecords = [];
      for (const student of missingStudents) {
        const record = {
          studentId: student.id,
          sectionId: sectionId,
          date: date,
          isPresent: true // Default to present, can be changed later via UI
        };
        newRecords.push(record);
        console.log(`➕ إضافة: ${student.firstName} ${student.lastName} (${student.id})`);
      }
      
      // Bulk create
      const created = await Attendance.bulkCreate(newRecords);
      addedCount += created.length;
      console.log(`✅ تم إضافة ${created.length} سجل لتاريخ ${date}`);
    }
    
    console.log(`\n🎉 تمت إضافة ${addedCount} سجل حضور جديد بنجاح!`);
    
    // Verify final counts
    for (const date of dates) {
      const finalCount = await Attendance.count({
        where: { date, sectionId }
      });
      console.log(`📊 العدد النهائي لتاريخ ${date}: ${finalCount} سجل`);
    }
    
  } catch (error) {
    console.error('❌ خطأ في إضافة سجلات الحضور:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  addMissingAttendance()
    .then(() => {
      console.log('✅ تم الانتهاء بنجاح');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ فشل:', error);
      process.exit(1);
    });
}

module.exports = { addMissingAttendance };