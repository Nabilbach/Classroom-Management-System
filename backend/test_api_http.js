const http = require('http');

function testApiLessons() {
    console.log('🧪 اختبار طلب /api/lessons...\n');

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/lessons',
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        console.log(`📊 حالة الاستجابة: ${res.statusCode}`);
        console.log(`📋 رؤوس الاستجابة:`, res.headers);

        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                if (res.statusCode === 200) {
                    const lessons = JSON.parse(data);
                    console.log(`✅ نجح الطلب - عدد الدروس: ${lessons.length}`);
                    
                    if (lessons.length > 0) {
                        console.log('\n📋 عينة من الدروس:');
                        lessons.slice(0, 3).forEach((lesson, index) => {
                            console.log(`   ${index + 1}. ID: ${lesson.id}`);
                            console.log(`       القسم: ${lesson.sectionId}`);
                            console.log(`       التاريخ: ${lesson.date}`);
                            console.log(`       الحالة: ${lesson.status}`);
                            console.log('');
                        });
                    }
                } else {
                    console.error(`❌ فشل الطلب - الحالة: ${res.statusCode}`);
                    console.error(`📄 البيانات:`, data);
                }
            } catch (error) {
                console.error('❌ خطأ في تحليل JSON:', error.message);
                console.error('📄 البيانات الخام:', data);
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ خطأ في الطلب:', error.message);
    });

    req.end();
}

testApiLessons();