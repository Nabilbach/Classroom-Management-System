const fs = require('fs');
const path = require('path');
const { AdminScheduleEntry, Section } = require('./models');

async function restoreScheduleFromCSV() {
  try {
    console.log('📅 بدء استعادة الجدول الزمني من ملف CSV...\n');

    // قراءة ملف CSV
    const csvPath = path.join(__dirname, '..', 'schedule.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    // تخطي العنوان
    const dataLines = lines.slice(1);
    
    console.log(`📊 تم العثور على ${dataLines.length} إدخال في ملف CSV`);

    // جلب جميع الأقسام لمطابقة الأسماء
    const sections = await Section.findAll();
    const sectionMap = new Map();
    sections.forEach(section => {
      sectionMap.set(section.name, section.id);
    });

    console.log(`📚 تم العثور على ${sections.length} قسم في قاعدة البيانات`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const line of dataLines) {
      if (!line.trim()) continue;

      // تحليل السطر (CSV منفصل بـ semicolon)
      const parts = line.split(';');
      if (parts.length < 8) {
        console.log(`⚠️ تخطي سطر غير مكتمل: ${line}`);
        skippedCount++;
        continue;
      }

      const [day, startTime, duration, sectionName, subject, teacher, classroom, sessionType] = parts;

      // البحث عن ID القسم
      const sectionId = sectionMap.get(sectionName.trim());
      if (!sectionId) {
        console.log(`⚠️ لم يتم العثور على القسم: ${sectionName}`);
        skippedCount++;
        continue;
      }

      // إنشاء إدخال الجدول الزمني
      try {
        await AdminScheduleEntry.create({
          id: Date.now().toString() + Math.random().toString().substr(2, 5),
          day: day.trim(),
          startTime: startTime.trim(),
          duration: parseInt(duration) || 1,
          sectionId: sectionId,
          subject: subject.trim() || 'التربية الإسلامية',
          teacher: teacher.trim() || '',
          classroom: classroom.trim() || '',
          sessionType: sessionType.trim() || 'official'
        });

        createdCount++;
        console.log(`✅ تم إنشاء جلسة: ${day} ${startTime} - ${sectionName}`);
      } catch (error) {
        console.log(`❌ خطأ في إنشاء الجلسة لـ ${sectionName}: ${error.message}`);
        skippedCount++;
      }
    }

    console.log(`\n📊 ملخص الاستعادة:`);
    console.log(`✅ تم إنشاء: ${createdCount} جلسة`);
    console.log(`⚠️ تم تخطي: ${skippedCount} جلسة`);
    console.log(`📅 تم استعادة الجدول الزمني بنجاح!`);

  } catch (error) {
    console.error('❌ خطأ في استعادة الجدول الزمني:', error);
  }
}

// تشغيل السكريبت
restoreScheduleFromCSV()
  .then(() => {
    console.log('\n🎉 انتهت عملية الاستعادة');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ فشل في استعادة الجدول الزمني:', error);
    process.exit(1);
  });