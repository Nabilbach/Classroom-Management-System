const path = require('path');
process.chdir(path.join(__dirname, '..'));
const {sequelize,AdminScheduleEntry,ScheduledLesson,Student,Section,Attendance}=require('../models');

(async()=>{
  try {
    await sequelize.authenticate();
    const counts={
      AdminScheduleEntry: await AdminScheduleEntry.count(),
      ScheduledLesson: await ScheduledLesson.count(),
      Student: await Student.count(),
      Section: await Section.count(),
      Attendance: await Attendance.count()
    };
    console.log('Current Database Statistics (classroom.db):');
    console.log(JSON.stringify(counts, null, 2));
    
    // Get latest records
    const latestAdmin = await AdminScheduleEntry.findOne({order:[['createdAt','DESC']]});
    const latestScheduled = await ScheduledLesson.findOne({order:[['date','DESC']]});
    
    console.log('\nLatest Records:');
    console.log('AdminScheduleEntry latest createdAt:', latestAdmin?.createdAt || 'none');
    console.log('ScheduledLesson latest date:', latestScheduled?.date || 'none');
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
