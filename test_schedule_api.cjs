const http = require('http');

/**
 * اختبار API للجدول الزمني الإداري
 * Test API for Administrative Schedule
 */

console.log('🧪 اختبار API للجدول الزمني...\n');

function testAdminScheduleAPI() {
    console.log('📡 إرسال طلب GET إلى /api/admin-schedule...');
    
    const req = http.request('http://localhost:3000/api/admin-schedule', { 
        method: 'GET',
        timeout: 5000 
    }, (res) => {
        console.log(`📊 حالة الاستجابة: ${res.statusCode}`);
        console.log(`📋 رؤوس الاستجابة:`, res.headers);
        
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                console.log(`\n📄 البيانات الخام (أول 500 حرف):`);
                console.log(data.substring(0, 500));
                
                if (res.statusCode === 200) {
                    const events = JSON.parse(data);
                    console.log(`\n✅ تم جلب البيانات بنجاح!`);
                    console.log(`📊 عدد الأحداث المُسترجعة: ${events.length}`);
                    
                    if (events.length > 0) {
                        console.log(`\n📋 أول 3 أحداث:`);
                        events.slice(0, 3).forEach((event, index) => {
                            console.log(`\n${index + 1}. حدث رقم ${event.id}:`);
                            console.log(`   📅 اليوم: ${event.day}`);
                            console.log(`   ⏰ الوقت: ${event.startTime}`);
                            console.log(`   ⏱️ المدة: ${event.duration} دقيقة`);
                            console.log(`   🏫 القسم: ${event.sectionId}`);
                            console.log(`   📚 المادة: ${event.subject || 'غير محدد'}`);
                            console.log(`   👨‍🏫 المعلم: ${event.teacher || 'غير محدد'}`);
                            console.log(`   🏛️ القاعة: ${event.classroom || 'غير محدد'}`);
                            console.log(`   📝 النوع: ${event.sessionType || 'غير محدد'}`);
                            console.log(`   🕐 تاريخ الإنشاء: ${event.createdAt}`);
                            console.log(`   🔄 تاريخ التحديث: ${event.updatedAt}`);
                        });
                        
                        console.log(`\n💡 الخلاصة: البيانات موجودة في API!`);
                        console.log(`❓ إذا كانت البيانات موجودة هنا، فالمشكلة في:`);
                        console.log(`   1. 🔗 ربط Frontend بـ API`);
                        console.log(`   2. 🎨 عرض البيانات في واجهة المستخدم`);
                        console.log(`   3. 🔄 تحديث البيانات في الواجهة`);
                        
                    } else {
                        console.log(`\n⚠️ API يعمل لكن لا توجد أحداث مُسترجعة`);
                        console.log(`❓ الأسباب المحتملة:`);
                        console.log(`   1. 🔍 Model لا يقرأ الجدول الصحيح`);
                        console.log(`   2. 🏷️ اختلاف في أسماء الحقول`);
                        console.log(`   3. 📊 مشكلة في Sequelize ORM`);
                    }
                } else {
                    console.log(`\n❌ خطأ في API: ${res.statusCode}`);
                    console.log(`📄 محتوى الخطأ: ${data}`);
                }
                
            } catch (parseError) {
                console.error('❌ خطأ في تحليل JSON:', parseError);
                console.log('📄 البيانات الخام:', data);
            }
        });
    });
    
    req.on('error', (error) => {
        if (error.code === 'ECONNREFUSED') {
            console.error('❌ فشل في الاتصال بالسيرفر!');
            console.log('💡 تأكد من أن السيرفر يعمل على المنفذ 3000');
            console.log('🔧 لتشغيل السيرفر: npm start أو node backend/index.js');
        } else {
            console.error('❌ خطأ في الطلب:', error);
        }
    });
    
    req.on('timeout', () => {
        console.error('❌ انتهت مهلة الطلب (5 ثوان)');
        req.destroy();
    });
    
    req.end();
}

// تشغيل الاختبار
testAdminScheduleAPI();