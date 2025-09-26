// تعيين متغير البيئة للمحاكاة
process.env.TEST_CURRENT_LESSON = 'true';

const path = require('path');
const { analyzeCurrentSchedule } = require(path.join(__dirname, 'analyze-current-schedule'));

async function testCurrentLessonDetection() {
    try {
        console.log('🧪 بدء اختبار محاكاة الحصة الحالية...\n');
        
        const result = await analyzeCurrentSchedule();
        
        console.log('🎯 نتائج المحاكاة:');
        console.log('==================');
        console.log('📅 اليوم المحاكى:', result.currentDay);
        console.log('🕐 الوقت المحاكى:', result.currentTime);
        console.log('🏫 هل في وقت التدريس:', result.isTeachingTime);
        
        if (result.currentLesson) {
            console.log('\n✅ الحصة الحالية:');
            console.log('   📚 القسم:', result.currentLesson.sectionName);
            console.log('   🆔 معرف القسم:', result.currentLesson.sectionId);
            console.log('   ⏰ وقت البداية:', result.currentLesson.startTime);
            console.log('   ⏱️ المدة:', result.currentLesson.duration, 'ساعة');
            console.log('   📖 المادة:', result.currentLesson.subject || 'غير محدد');
            console.log('   👨‍🏫 الأستاذ:', result.currentLesson.teacher || 'غير محدد');
        } else {
            console.log('\n❌ لا توجد حصة حالية');
        }
        
        if (result.nextLesson) {
            console.log('\n⏭️ الحصة القادمة:');
            console.log('   📚 القسم:', result.nextLesson.sectionName);
            console.log('   ⏰ وقت البداية:', result.nextLesson.startTime);
        } else {
            console.log('\n⏭️ لا توجد حصة قادمة اليوم');
        }
        
        if (result.defaultSection) {
            console.log('\n🔄 القسم الافتراضي:');
            console.log('   📚 الاسم:', result.defaultSection.name);
            console.log('   🆔 المعرف:', result.defaultSection.id);
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('📋 JSON النتيجة:');
        console.log(JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.error('❌ خطأ في الاختبار:', error);
    }
}

testCurrentLessonDetection();