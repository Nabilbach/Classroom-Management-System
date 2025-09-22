const { AdminScheduleEntry } = require('./models');

const DAY_MAP = {
  'Monday': 'الإثنين',
  'Tuesday': 'الثلاثاء', 
  'Wednesday': 'الأربعاء',
  'Thursday': 'الخميس',
  'Friday': 'الجمعة',
  'Saturday': 'السبت',
  'Sunday': 'الأحد'
};

async function fixScheduleDays() {
  try {
    console.log('🔄 بدء تصحيح أسماء الأيام في الجدول الزمني...');
    
    const entries = await AdminScheduleEntry.findAll();
    console.log(`📊 تم العثور على ${entries.length} جلسة`);
    
    let updatedCount = 0;
    
    for (const entry of entries) {
      const currentDay = entry.day;
      const arabicDay = DAY_MAP[currentDay];
      
      if (arabicDay && arabicDay !== currentDay) {
        await entry.update({ day: arabicDay });
        console.log(`✅ تم تحديث: ${currentDay} → ${arabicDay}`);
        updatedCount++;
      } else if (!arabicDay) {
        console.log(`⚠️ يوم غير معروف: ${currentDay}`);
      }
    }
    
    console.log(`📊 تم تحديث ${updatedCount} جلسة`);
    console.log('✅ تم تصحيح أسماء الأيام بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في تصحيح أسماء الأيام:', error);
    throw error;
  }
}

// تشغيل السكريبت
fixScheduleDays()
  .then(() => {
    console.log('🎉 انتهت عملية التصحيح');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ فشل في تصحيح أسماء الأيام:', error);
    process.exit(1);
  });