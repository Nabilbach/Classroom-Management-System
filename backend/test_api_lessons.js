const axios = require('axios');

async function testApiLessons() {
    try {
        console.log('🧪 اختبار طلب /api/lessons...\n');

        const response = await axios.get('http://localhost:3000/api/lessons');
        
        console.log(`✅ نجح الطلب - الحالة: ${response.status}`);
        console.log(`📊 عدد الدروس المُرجعة: ${response.data.length}`);
        
        if (response.data.length > 0) {
            console.log('\n📋 عينة من الدروس:');
            response.data.slice(0, 3).forEach((lesson, index) => {
                console.log(`   ${index + 1}. ID: ${lesson.id}`);
                console.log(`       القسم: ${lesson.sectionId}`);
                console.log(`       التاريخ: ${lesson.date}`);
                console.log(`       الحالة: ${lesson.status}`);
                console.log('');
            });
        }

    } catch (error) {
        console.error('❌ فشل الطلب:', error.response?.status || error.message);
        if (error.response?.data) {
            console.error('📄 تفاصيل الخطأ:', error.response.data);
        }
    }
}

testApiLessons();