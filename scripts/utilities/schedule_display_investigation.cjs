const sqlite3 = require('sqlite3').verbose();

/**
 * تحقيق في مشكلة عدم ظهور الأحداث في الجدول الزمني
 * Investigation of Missing Events in Schedule Display
 */

console.log('🔍 تحقيق في مشكلة الأحداث المختفية من الجدول الزمني\n');

const db = new sqlite3.Database('classroom.db', sqlite3.OPEN_READONLY);

// فحص جميع جداول الأحداث الموجودة
function investigateScheduleDisplay() {
    console.log('📊 فحص البيانات الموجودة في جداول الأحداث...\n');
    
    // 1. فحص AdminScheduleEntries
    db.all(`
        SELECT 
            id, day, startTime, duration, sectionId, 
            subject, teacher, classroom, sessionType,
            createdAt, updatedAt
        FROM AdminScheduleEntries 
        ORDER BY createdAt DESC
    `, (err, adminEvents) => {
        
        if (err) {
            console.error('❌ خطأ في قراءة AdminScheduleEntries:', err);
            return;
        }
        
        console.log(`📋 AdminScheduleEntries: ${adminEvents.length} حدث`);
        
        if (adminEvents.length > 0) {
            console.log('\n📝 عينة من الأحداث في AdminScheduleEntries:');
            adminEvents.slice(0, 5).forEach((event, index) => {
                console.log(`${index + 1}. ID: ${event.id}`);
                console.log(`   📅 اليوم: ${event.day}`);
                console.log(`   ⏰ الوقت: ${event.startTime}`);
                console.log(`   📚 المادة: ${event.subject || 'غير محدد'}`);
                console.log(`   🏫 القسم: ${event.sectionId}`);
                console.log(`   👨‍🏫 المعلم: ${event.teacher || 'غير محدد'}`);
                console.log(`   🏛️ القاعة: ${event.classroom || 'غير محدد'}`);
                console.log(`   📝 النوع: ${event.sessionType || 'غير محدد'}`);
                console.log(`   🕐 تاريخ الإنشاء: ${event.createdAt}`);
                console.log('');
            });
        }
        
        // 2. فحص administrative_timetable
        db.all(`
            SELECT * FROM administrative_timetable 
            ORDER BY createdAt DESC
        `, (err, adminTimetable) => {
            
            if (err) {
                console.error('❌ خطأ في قراءة administrative_timetable:', err);
                return;
            }
            
            console.log(`📋 administrative_timetable: ${adminTimetable.length} حدث`);
            
            if (adminTimetable.length > 0) {
                console.log('\n📝 عينة من administrative_timetable:');
                adminTimetable.slice(0, 3).forEach((event, index) => {
                    console.log(`${index + 1}. ID: ${event.id}`);
                    console.log(`   📅 اليوم: ${event.day}`);
                    console.log(`   ⏰ الوقت: ${event.startTime}`);
                    console.log(`   🏫 القسم: ${event.sectionId}`);
                    console.log(`   🏛️ القاعة: ${event.classroom}`);
                    console.log(`   👨‍🏫 المعلم: ${event.teacherId}`);
                    console.log(`   🕐 تاريخ الإنشاء: ${event.createdAt}`);
                    console.log('');
                });
            }
            
            // 3. فحص الجداول الأخرى المحتملة
            checkOtherEventTables(adminEvents, adminTimetable);
        });
    });
}

function checkOtherEventTables(adminEvents, adminTimetable) {
    console.log('='.repeat(80));
    console.log('🔍 فحص الجداول الأخرى المحتملة للأحداث');
    console.log('='.repeat(80));
    
    // فحص Lessons إذا كان يحتوي على بيانات جدولة
    db.all(`SELECT * FROM Lessons ORDER BY createdAt DESC LIMIT 5`, (err, lessons) => {
        if (!err && lessons.length > 0) {
            console.log(`\n📚 Lessons: ${lessons.length} درس (أحدث 5)`);
            lessons.forEach((lesson, index) => {
                console.log(`${index + 1}. ID: ${lesson.id} - ${lesson.customTitle || lesson.title || 'بدون عنوان'}`);
                console.log(`   📅 التاريخ: ${lesson.date || 'غير محدد'}`);
                console.log(`   ⏰ الوقت: ${lesson.startTime || 'غير محدد'}`);
                console.log(`   🏫 الأقسام: ${lesson.assignedSections || 'غير محدد'}`);
            });
        }
        
        // تحليل المشكلة
        analyzeScheduleDisplayIssue(adminEvents, adminTimetable, lessons || []);
    });
}

function analyzeScheduleDisplayIssue(adminEvents, adminTimetable, lessons) {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 تحليل مشكلة عدم ظهور الأحداث');
    console.log('='.repeat(80));
    
    const totalStoredEvents = adminEvents.length + adminTimetable.length;
    
    console.log(`\n📊 الإحصائيات:`);
    console.log(`   📋 AdminScheduleEntries: ${adminEvents.length} حدث`);
    console.log(`   📋 administrative_timetable: ${adminTimetable.length} حدث`);
    console.log(`   📚 Lessons: ${lessons.length} درس`);
    console.log(`   📊 إجمالي الأحداث المُخزنة: ${totalStoredEvents}`);
    
    // تحديد المشكلة المحتملة
    console.log('\n🔍 التحليل:');
    
    if (totalStoredEvents === 0) {
        console.log('❌ المشكلة: لا توجد أحداث مُخزنة في قاعدة البيانات');
        console.log('💡 الحلول المحتملة:');
        console.log('   1. التحقق من عملية إدراج الأحداث');
        console.log('   2. فحص الأخطاء في واجهة إضافة الأحداث');
        console.log('   3. التأكد من صحة أسماء الجداول');
    } else if (adminEvents.length > 0) {
        console.log('✅ البيانات موجودة في AdminScheduleEntries');
        console.log('🔍 المشكلة المحتملة في عرض البيانات:');
        console.log('   1. مشكلة في استعلام العرض (Frontend/Backend)');
        console.log('   2. مشكلة في تحويل التواريخ/الأوقات');
        console.log('   3. مشكلة في فلترة البيانات');
        console.log('   4. مشكلة في واجهة المستخدم');
        
        // فحص تفاصيل البيانات
        console.log('\n📋 فحص تفاصيل البيانات:');
        
        // فحص الأيام
        const days = [...new Set(adminEvents.map(e => e.day))];
        console.log(`   📅 الأيام الموجودة: ${days.join(', ')}`);
        
        // فحص الأوقات
        const times = [...new Set(adminEvents.map(e => e.startTime))];
        console.log(`   ⏰ الأوقات الموجودة: ${times.join(', ')}`);
        
        // فحص الأقسام
        const sections = [...new Set(adminEvents.map(e => e.sectionId))];
        console.log(`   🏫 الأقسام الموجودة: ${sections.length} قسم مختلف`);
        
        // فحص تواريخ الإنشاء
        const creationDates = adminEvents.map(e => e.createdAt?.split('T')[0]).filter(Boolean);
        const uniqueCreationDates = [...new Set(creationDates)];
        console.log(`   🕐 تواريخ الإنشاء: ${uniqueCreationDates.join(', ')}`);
        
    } else {
        console.log('⚠️ لا توجد أحداث في AdminScheduleEntries');
        console.log('🔍 يجب البحث في جداول أخرى أو إعادة إنشاء الأحداث');
    }
    
    // اقتراحات للحل
    console.log('\n💡 خطة الحل:');
    console.log('1. 🔍 فحص API endpoint للجدول الزمني');
    console.log('2. 📊 فحص استعلام قاعدة البيانات المستخدم في العرض');
    console.log('3. 🧪 اختبار الاستعلام مباشرة');
    console.log('4. 🔧 إصلاح مشكلة العرض إذا وُجدت');
    
    // إنشاء استعلام للاختبار
    generateTestQuery(adminEvents);
    
    db.close();
}

function generateTestQuery(adminEvents) {
    console.log('\n🧪 استعلام اختباري للتحقق من البيانات:');
    console.log('='.repeat(50));
    
    const testQuery = `
    SELECT 
        id, day, startTime, duration, sectionId, 
        subject, teacher, classroom, sessionType,
        createdAt
    FROM AdminScheduleEntries 
    ORDER BY 
        CASE day 
            WHEN 'الإثنين' THEN 1
            WHEN 'الثلاثاء' THEN 2  
            WHEN 'الأربعاء' THEN 3
            WHEN 'الخميس' THEN 4
            WHEN 'الجمعة' THEN 5
            WHEN 'السبت' THEN 6
            WHEN 'الأحد' THEN 7
            ELSE 8
        END,
        startTime
    `;
    
    console.log('📋 الاستعلام المقترح للتحقق:');
    console.log(testQuery);
    
    if (adminEvents.length > 0) {
        console.log('\n✅ هذا الاستعلام يجب أن يُرجع بيانات');
        console.log(`📊 متوقع: ${adminEvents.length} سجل`);
    } else {
        console.log('\n❌ هذا الاستعلام لن يُرجع بيانات - المشكلة في التخزين');
    }
}

// بدء التحقيق
investigateScheduleDisplay();