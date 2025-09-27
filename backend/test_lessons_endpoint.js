const db = require('./models');

async function testLessonsEndpoint() {
    try {
        console.log('🧪 اختبار endpoint /api/lessons...\n');

        // محاولة جلب الدروس كما يفعل endpoint
        const lessons = await db.Lesson.findAll();
        
        console.log(`✅ تم جلب ${lessons.length} درس بنجاح`);
        
        if (lessons.length > 0) {
            console.log('\n📋 عينة من الدروس:');
            lessons.slice(0, 3).forEach((lesson, index) => {
                console.log(`   ${index + 1}. ID: ${lesson.id}`);
                console.log(`       القسم: ${lesson.sectionId}`);
                console.log(`       التاريخ: ${lesson.date}`);
                console.log(`       الحالة: ${lesson.status}`);
                console.log(`       المحتوى: ${lesson.actualContent ? lesson.actualContent.substring(0, 50) + '...' : 'غير محدد'}`);
                console.log('');
            });
        }

        // محاولة تسلسل البيانات كـ JSON
        const jsonData = JSON.stringify(lessons);
        console.log(`📦 حجم البيانات JSON: ${jsonData.length} حرف`);
        
        console.log('\n✅ endpoint /api/lessons يجب أن يعمل بشكل طبيعي');

    } catch (error) {
        console.error('❌ خطأ في اختبار endpoint:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        process.exit(0);
    }
}

testLessonsEndpoint();