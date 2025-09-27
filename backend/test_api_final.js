const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testAPIEndpoints() {
    console.log('🌐 اختبار API endpoints...\n');
    
    const endpoints = [
        { url: '/students', name: 'الطلاب' },
        { url: '/sections', name: 'الأقسام' },
        { url: '/lessons', name: 'الدروس المكتملة' },
        { url: '/scheduled-lessons', name: 'الدروس المجدولة (التقويم)' }
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`📡 اختبار ${endpoint.name}...`);
            const response = await axios.get(`${BASE_URL}${endpoint.url}`, {
                timeout: 5000
            });
            
            if (Array.isArray(response.data)) {
                console.log(`✅ ${endpoint.name}: ${response.data.length} عنصر`);
                if (response.data.length > 0) {
                    const firstItem = response.data[0];
                    const keys = Object.keys(firstItem).slice(0, 3);
                    console.log(`   عينة: ${keys.map(k => `${k}: ${firstItem[k]}`).join(', ')}`);
                }
            } else {
                console.log(`✅ ${endpoint.name}: استجابة صحيحة`);
            }
            console.log('');
            
        } catch (error) {
            console.log(`❌ ${endpoint.name}: خطأ`);
            if (error.code === 'ECONNREFUSED') {
                console.log(`   الخادم غير متاح على المنفذ 3000`);
            } else if (error.response) {
                console.log(`   كود الخطأ: ${error.response.status}`);
                console.log(`   الرسالة: ${error.response.data}`);
            } else {
                console.log(`   الرسالة: ${error.message}`);
            }
            console.log('');
        }
    }
    
    console.log('🏁 انتهى اختبار API');
}

// إعطاء الخادم وقت للبدء
setTimeout(() => {
    testAPIEndpoints().catch(console.error);
}, 2000);