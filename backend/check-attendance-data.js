const { Attendance, Student, Section } = require('./models');

async function checkData() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const count = await Attendance.count();
    const todayCount = await Attendance.count({ where: { date: today } });
    const present = await Attendance.count({ where: { date: today, isPresent: true } });
    
    console.log('إجمالي السجلات:', count);
    console.log('سجلات اليوم:', todayCount);
    console.log('الحاضرون اليوم:', present);
    if(todayCount > 0) {
      console.log('نسبة الحضور اليوم:', Math.round((present/todayCount)*100) + '%');
    }
    
    // Get some sample data
    const samples = await Attendance.findAll({ 
      limit: 5, 
      include: [{ model: Student, attributes: ['name'] }],
      order: [['createdAt', 'DESC']]
    });
    
    console.log('\nعينة من البيانات:');
    samples.forEach(att => {
      const studentName = att.Student?.name || 'غير محدد';
      const status = att.isPresent ? 'حاضر' : 'غائب';
      console.log(`- ${studentName}: ${status} (${att.date})`);
    });
    
    process.exit(0);
  } catch(err) {
    console.error('خطأ:', err.message);
    process.exit(1);
  }
}

checkData();