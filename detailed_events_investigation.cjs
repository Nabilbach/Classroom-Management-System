const sqlite3 = require('sqlite3').verbose();

/**
 * تحقيق مفصل في الأحداث المفقودة من الجدول الزمني
 * Detailed Investigation of Missing Schedule Events
 */

console.log('🔍 تحقيق تفصيلي في الأحداث المفقودة من الجدول الزمني\n');

const currentDb = new sqlite3.Database('classroom.db', sqlite3.OPEN_READONLY);
const backupDb = new sqlite3.Database('classroom_backup_20250924_174347.db', sqlite3.OPEN_READONLY);

function compareEventData() {
    console.log('📊 مقارنة بيانات الأحداث بين قاعدة البيانات الحالية والنسخة الاحتياطية...\n');
    
    // جلب البيانات من قاعدة البيانات الحالية
    currentDb.all(`
        SELECT 
            id, day, startTime, duration, sectionId, 
            subject, teacher, classroom, sessionType,
            createdAt, updatedAt
        FROM AdminScheduleEntries 
        ORDER BY createdAt DESC
    `, (err, currentEvents) => {
        
        if (err) {
            console.error('❌ خطأ في قراءة البيانات الحالية:', err);
            return;
        }
        
        console.log(`📋 الأحداث الحالية: ${currentEvents.length}`);
        
        // جلب البيانات من النسخة الاحتياطية
        backupDb.all(`
            SELECT 
                id, day, startTime, duration, sectionId, 
                subject, teacher, classroom, sessionType,
                createdAt, updatedAt
            FROM AdminScheduleEntries 
            ORDER BY createdAt DESC
        `, (err, backupEvents) => {
            
            if (err) {
                console.error('❌ خطأ في قراءة النسخة الاحتياطية:', err);
                return;
            }
            
            console.log(`💾 الأحداث في النسخة الاحتياطية: ${backupEvents.length}\n`);
            
            // تحليل الاختلافات
            console.log('='.repeat(80));
            console.log('🔍 تحليل الاختلافات المكتشفة');
            console.log('='.repeat(80));
            
            // إنشاء خريطة للأحداث الحالية
            const currentEventIds = new Set(currentEvents.map(event => event.id));
            const backupEventIds = new Set(backupEvents.map(event => event.id));
            
            // الأحداث المفقودة (موجودة في النسخة الاحتياطية وليس في الحالية)
            const missingEvents = backupEvents.filter(event => !currentEventIds.has(event.id));
            
            // الأحداث الجديدة (موجودة في الحالية وليس في النسخة الاحتياطية)
            const newEvents = currentEvents.filter(event => !backupEventIds.has(event.id));
            
            console.log(`❌ أحداث مفقودة: ${missingEvents.length}`);
            console.log(`➕ أحداث جديدة: ${newEvents.length}\n`);
            
            if (missingEvents.length > 0) {
                console.log('🚨 تفاصيل الأحداث المفقودة:');
                console.log('-'.repeat(60));
                missingEvents.forEach((event, index) => {
                    console.log(`${index + 1}. ID: ${event.id}`);
                    console.log(`   📅 اليوم: ${event.day}`);
                    console.log(`   ⏰ الوقت: ${event.startTime}`);
                    console.log(`   📚 المادة: ${event.subject || 'غير محدد'}`);
                    console.log(`   🏫 القسم: ${event.sectionId}`);
                    console.log(`   👨‍🏫 المعلم: ${event.teacher || 'غير محدد'}`);
                    console.log(`   🏛️ القاعة: ${event.classroom || 'غير محدد'}`);
                    console.log(`   📝 نوع الجلسة: ${event.sessionType || 'غير محدد'}`);
                    console.log(`   🕐 تاريخ الإنشاء: ${event.createdAt}`);
                    console.log('');
                });
            }
            
            if (newEvents.length > 0) {
                console.log('➕ تفاصيل الأحداث الجديدة:');
                console.log('-'.repeat(60));
                newEvents.forEach((event, index) => {
                    console.log(`${index + 1}. ID: ${event.id}`);
                    console.log(`   📅 اليوم: ${event.day}`);
                    console.log(`   ⏰ الوقت: ${event.startTime}`);
                    console.log(`   📚 المادة: ${event.subject || 'غير محدد'}`);
                    console.log(`   🏫 القسم: ${event.sectionId}`);
                    console.log(`   👨‍🏫 المعلم: ${event.teacher || 'غير محدد'}`);
                    console.log(`   🏛️ القاعة: ${event.classroom || 'غير محدد'}`);
                    console.log(`   📝 نوع الجلسة: ${event.sessionType || 'غير محدد'}`);
                    console.log(`   🕐 تاريخ الإنشاء: ${event.createdAt}`);
                    console.log('');
                });
            }
            
            // تحليل أنماط الوقت
            console.log('='.repeat(80));
            console.log('📊 تحليل أنماط الوقت');
            console.log('='.repeat(80));
            
            if (missingEvents.length > 0) {
                console.log('\n⏰ تواريخ إنشاء الأحداث المفقودة:');
                const missingDates = missingEvents.map(event => event.createdAt?.split('T')[0]).filter(Boolean);
                const dateCount = {};
                missingDates.forEach(date => {
                    dateCount[date] = (dateCount[date] || 0) + 1;
                });
                
                Object.entries(dateCount).sort().forEach(([date, count]) => {
                    console.log(`   ${date}: ${count} حدث`);
                });
            }
            
            if (newEvents.length > 0) {
                console.log('\n⏰ تواريخ إنشاء الأحداث الجديدة:');
                const newDates = newEvents.map(event => event.createdAt?.split('T')[0]).filter(Boolean);
                const dateCount = {};
                newDates.forEach(date => {
                    dateCount[date] = (dateCount[date] || 0) + 1;
                });
                
                Object.entries(dateCount).sort().forEach(([date, count]) => {
                    console.log(`   ${date}: ${count} حدث`);
                });
            }
            
            // الخلاصة والتوصيات
            console.log('\n' + '='.repeat(80));
            console.log('💡 الخلاصة والتوصيات');
            console.log('='.repeat(80));
            
            if (missingEvents.length === 0 && newEvents.length === 0) {
                console.log('✅ لا توجد اختلافات في جدول الأحداث - النظام مستقر');
            } else {
                if (missingEvents.length > 0) {
                    console.log(`🚨 تم فقدان ${missingEvents.length} حدث من الجدول الزمني`);
                    console.log('📋 يُنصح بـ:');
                    console.log('   1. استعادة الأحداث المفقودة من النسخة الاحتياطية');
                    console.log('   2. تحديد سبب فقدان الأحداث');
                    console.log('   3. تطبيق آليات حماية لمنع التكرار');
                }
                
                if (newEvents.length > 0) {
                    console.log(`➕ تم إضافة ${newEvents.length} حدث جديد منذ النسخة الاحتياطية`);
                    console.log('📋 يُنصح بـ:');
                    console.log('   1. التأكد من صحة الأحداث الجديدة');
                    console.log('   2. إنشاء نسخة احتياطية محدثة');
                }
            }
            
            console.log('\n🔧 الخطوات التالية:');
            console.log('   1. 💾 إنشاء نسخة احتياطية فورية قبل أي تعديل');
            console.log('   2. 🔄 استعادة الأحداث المفقودة إذا لزم الأمر');
            console.log('   3. 🛡️ تطبيق نظام حماية شامل');
            console.log('   4. 📊 تفعيل المراقبة الدورية');
            
            // إغلاق الاتصالات
            currentDb.close();
            backupDb.close();
            
            console.log('\n✅ تم الانتهاء من التحقيق التفصيلي في الأحداث');
        });
    });
}

// تشغيل التحقيق
compareEventData();