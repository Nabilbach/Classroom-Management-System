const { Attendance, Student, Section } = require('./models');

async function testAPI() {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log('تاريخ اليوم:', today);
    
    const records = await Attendance.findAll({
      where: { date: today },
      limit: 5
    });
    
    console.log('السجلات المسترجعة من API:');
    records.forEach((record, i) => {
      console.log(`${i+1}. studentId: ${record.studentId}, isPresent: ${record.isPresent}, date: ${record.date}`);
    });
    
    // Test API format
    const apiFormat = records.map(record => ({
      id: record.id,
      studentId: record.studentId,
      sectionId: record.sectionId,
      date: record.date,
      isPresent: record.isPresent
    }));
    
    console.log('\nتنسيق API:');
    console.log(JSON.stringify(apiFormat, null, 2));
    
    process.exit(0);
  } catch(err) {
    console.error('خطأ:', err.message);
    process.exit(1);  
  }
}

testAPI();