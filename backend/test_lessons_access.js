const db = require('./models');

async function testLessonsAndLogs() {
    try {
        console.log('🧪 اختبار الوصول إلى الدروس وسجلات الحصص...\n');

        // اختبار جلب الدروس
        const lessons = await db.Lesson.findAll({
            limit: 5
        });

        console.log(`📚 تم العثور على ${lessons.length} درس في قاعدة البيانات:`);
        lessons.forEach((lesson, index) => {
            console.log(`   ${index + 1}. ${lesson.id} - القسم: ${lesson.sectionId} - التاريخ: ${lesson.date}`);
            console.log(`       المحتوى: ${lesson.actualContent ? lesson.actualContent.substring(0, 60) + '...' : 'غير محدد'}`);
        });

        // اختبار جلب سجلات الحصص
        const logs = await db.LessonLog.findAll({
            limit: 5
        });

        console.log(`\n📝 تم العثور على ${logs.length} سجل حصة في قاعدة البيانات:`);
        logs.forEach((log, index) => {
            console.log(`   ${index + 1}. ${log.id} - التاريخ: ${log.date} - القسم: ${log.sectionId || 'غير محدد'}`);
        });

        // اختبار جلب الدروس حسب القسم
        const lessonsBySection = await db.Lesson.findAll({
            where: {
                sectionId: 'section-1'
            },
            limit: 3
        });

        console.log(`\n🏫 دروس القسم section-1 (${lessonsBySection.length} درس):`);
        lessonsBySection.forEach((lesson, index) => {
            console.log(`   ${index + 1}. ${lesson.id} - ${lesson.date} - الحالة: ${lesson.status || 'غير محدد'}`);
        });

        console.log('\n✅ تم اختبار الوصول إلى البيانات بنجاح!');

    } catch (error) {
        console.error('❌ خطأ في اختبار البيانات:', error);
    } finally {
        process.exit(0);
    }
}

testLessonsAndLogs();