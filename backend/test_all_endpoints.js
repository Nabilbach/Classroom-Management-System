const http = require('http');

async function testAllEndpoints() {
    console.log('🧪 اختبار جميع endpoints المطلوبة...\n');

    const endpoints = [
        '/api/lessons',
        '/api/sections', 
        '/api/students',
        '/api/schedule/current-lesson'
    ];

    for (const endpoint of endpoints) {
        await testEndpoint(endpoint);
        console.log(''); // سطر فارغ
    }
}

function testEndpoint(path) {
    return new Promise((resolve) => {
        console.log(`🔍 اختبار ${path}...`);

        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const jsonData = JSON.parse(data);
                        if (Array.isArray(jsonData)) {
                            console.log(`✅ ${path}: ${jsonData.length} عنصر`);
                        } else if (jsonData.data) {
                            console.log(`✅ ${path}: نجح - ${jsonData.message || 'بيانات متاحة'}`);
                        } else {
                            console.log(`✅ ${path}: نجح`);
                        }
                    } catch (error) {
                        console.log(`✅ ${path}: نجح (بيانات غير JSON)`);
                    }
                } else {
                    console.log(`❌ ${path}: فشل - الحالة ${res.statusCode}`);
                }
                resolve();
            });
        });

        req.on('error', (error) => {
            console.log(`❌ ${path}: خطأ - ${error.message}`);
            resolve();
        });

        req.end();
    });
}

testAllEndpoints();