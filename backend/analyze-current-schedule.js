const db = require('./models');
const { Op } = require('sequelize');

async function analyzeCurrentSchedule() {
    try {
        console.log('🔍 تحليل الجدول الأسبوعي الحالي...\n');

        // جلب جميع أحداث الجدول الإداري
        const scheduleEntries = await db.AdminScheduleEntry.findAll({
            order: [['day', 'ASC'], ['startTime', 'ASC']]
        });

        if (scheduleEntries.length === 0) {
            console.log('❌ لا يوجد جدول مجدول حالياً');
            return;
        }

        console.log(`📚 تم العثور على ${scheduleEntries.length} حصة مجدولة\n`);

        // تجميع الحصص حسب الأيام
        const scheduleByDay = {};
        scheduleEntries.forEach(entry => {
            if (!scheduleByDay[entry.day]) {
                scheduleByDay[entry.day] = [];
            }
            scheduleByDay[entry.day].push(entry);
        });

        // عرض الجدول
        const dayNames = {
            'Monday': 'الإثنين',
            'Tuesday': 'الثلاثاء', 
            'Wednesday': 'الأربعاء',
            'Thursday': 'الخميس',
            'Friday': 'الجمعة',
            'Saturday': 'السبت',
            'Sunday': 'الأحد'
        };

        Object.keys(scheduleByDay).forEach(day => {
            console.log(`\n📅 ${dayNames[day] || day}:`);
            scheduleByDay[day].forEach((entry, index) => {
                console.log(`   ${index + 1}. ${entry.startTime} - القسم: ${entry.sectionId} - المادة: ${entry.subject || 'غير محدد'} - الأستاذ: ${entry.teacher || 'غير محدد'}`);
            });
        });

        // جلب معلومات الأقسام للربط
        const sections = await db.Section.findAll();
        const sectionMap = {};
        sections.forEach(section => {
            sectionMap[section.id] = section.name;
        });

        console.log(`\n\n🏫 الأقسام المتاحة (${sections.length}):`);
        sections.forEach((section, index) => {
            console.log(`   ${index + 1}. ID: ${section.id} - الاسم: ${section.name}`);
        });

        // تحليل الوقت الحالي واكتشاف الحصة
        console.log('\n⏰ تحليل الوقت الحالي...');
        const now = new Date();
        
        // محاكاة للاختبار: تظاهر أننا يوم الإثنين الساعة 16:30 (في حصة TCSF-1)
        const TEST_MODE = process.env.TEST_CURRENT_LESSON === 'true';
        const currentDayEn = TEST_MODE ? 'Monday' : now.toLocaleDateString('en-US', { weekday: 'long' });
        const currentDay = TEST_MODE ? 'الإثنين' : (dayNames[currentDayEn] || currentDayEn);
        const currentTime = TEST_MODE ? '16:30' : now.toTimeString().slice(0, 5); // HH:MM format

        console.log(`📅 اليوم الحالي: ${currentDay}`);
        console.log(`🕐 الوقت الحالي: ${currentTime}`);

        // البحث عن الحصة الحالية أو القادمة
        console.log('🔍 الأيام المتاحة في الجدول:', Object.keys(scheduleByDay));
        const todaySchedule = scheduleByDay[currentDay] || [];
        console.log(`📋 حصص اليوم (${currentDay}): ${todaySchedule.length} حصة`);
        todaySchedule.forEach((entry, i) => {
            console.log(`   ${i+1}. ${entry.startTime} - ${sectionMap[entry.sectionId] || entry.sectionId}`);
        });
        
        let currentLesson = null;
        let nextLesson = null;

        todaySchedule.forEach(entry => {
            const startTime = entry.startTime;
            const duration = entry.duration || 1;
            const endTime = addHoursToTime(startTime, duration);
            
            console.log(`🔍 فحص الحصة: ${startTime}-${endTime} مقارنة بـ ${currentTime}`);
            
            if (isTimeInRange(currentTime, startTime, endTime)) {
                currentLesson = entry;
                console.log(`✅ وجدت حصة حالية: ${sectionMap[entry.sectionId] || entry.sectionId}`);
            } else if (startTime > currentTime && !nextLesson) {
                nextLesson = entry;
                console.log(`⏭️ وجدت حصة قادمة: ${sectionMap[entry.sectionId] || entry.sectionId}`);
            }
        });

        if (currentLesson) {
            console.log('\n🎯 الحصة الحالية:');
            console.log(`   ⏰ الوقت: ${currentLesson.startTime} (مدة: ${currentLesson.duration} ساعة)`);
            console.log(`   🏫 القسم: ${sectionMap[currentLesson.sectionId] || currentLesson.sectionId}`);
            console.log(`   📚 المادة: ${currentLesson.subject || 'غير محدد'}`);
            console.log(`   👨‍🏫 الأستاذ: ${currentLesson.teacher || 'غير محدد'}`);
            console.log(`   🏛️ القاعة: ${currentLesson.classroom || 'غير محدد'}`);
        } else if (nextLesson) {
            console.log('\n⏭️ الحصة القادمة:');
            console.log(`   ⏰ الوقت: ${nextLesson.startTime} (مدة: ${nextLesson.duration} ساعة)`);
            console.log(`   🏫 القسم: ${sectionMap[nextLesson.sectionId] || nextLesson.sectionId}`);
            console.log(`   📚 المادة: ${nextLesson.subject || 'غير محدد'}`);
            console.log(`   👨‍🏫 الأستاذ: ${nextLesson.teacher || 'غير محدد'}`);
            console.log(`   🏛️ القاعة: ${nextLesson.classroom || 'غير محدد'}`);
        } else {
            console.log('\n⚪ لا يوجد حصص حالياً أو قادمة لهذا اليوم');
            console.log('🔍 سيتم عرض القسم الافتراضي (أول قسم في القائمة)');
            if (sections.length > 0) {
                console.log(`📝 القسم الافتراضي: ${sections[0].name} (ID: ${sections[0].id})`);
            }
        }

        // إرجاع النتيجة للاستخدام في API
        return {
            currentLesson: currentLesson ? {
                sectionId: currentLesson.sectionId,
                sectionName: sectionMap[currentLesson.sectionId] || currentLesson.sectionId,
                startTime: currentLesson.startTime,
                duration: currentLesson.duration,
                subject: currentLesson.subject,
                teacher: currentLesson.teacher,
                classroom: currentLesson.classroom
            } : null,
            nextLesson: nextLesson ? {
                sectionId: nextLesson.sectionId,
                sectionName: sectionMap[nextLesson.sectionId] || nextLesson.sectionId,
                startTime: nextLesson.startTime,
                duration: nextLesson.duration,
                subject: nextLesson.subject,
                teacher: nextLesson.teacher,
                classroom: nextLesson.classroom
            } : null,
            defaultSection: sections.length > 0 ? {
                id: sections[0].id,
                name: sections[0].name
            } : null,
            currentTime,
            currentDay: dayNames[currentDay] || currentDay,
            isTeachingTime: !!currentLesson
        };

    } catch (error) {
        console.error('❌ خطأ في تحليل الجدول:', error);
        throw error;
    }
}

// دوال مساعدة للوقت
function addHoursToTime(timeStr, hours) {
    const [h, m] = timeStr.split(':').map(Number);
    const newHour = h + hours;
    return `${String(newHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function isTimeInRange(currentTime, startTime, endTime) {
    return currentTime >= startTime && currentTime < endTime;
}

// تشغيل التحليل إذا تم استدعاء الملف مباشرة
if (require.main === module) {
    analyzeCurrentSchedule()
        .then(() => {
            console.log('\n✅ تم إنهاء تحليل الجدول');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ فشل التحليل:', error);
            process.exit(1);
        });
}

module.exports = { analyzeCurrentSchedule };