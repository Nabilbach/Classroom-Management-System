const sqlite3 = require('sqlite3').verbose();

/**
 * إصلاح مشكلة عدم ظهور الأحداث في الجدول الزمني
 * Fix Missing Events in Schedule Display
 */

console.log('🔧 إصلاح مشكلة عدم ظهور الأحداث في الجدول الزمني\n');

const db = new sqlite3.Database('classroom.db');

async function fixScheduleDisplayIssue() {
    console.log('🔍 تحليل البيانات الحالية...\n');
    
    // جلب الأقسام المتاحة
    const sectionsQuery = 'SELECT id, name FROM Sections';
    const adminScheduleQuery = 'SELECT * FROM AdminScheduleEntries ORDER BY createdAt DESC';
    
    db.all(sectionsQuery, (err, sections) => {
        if (err) {
            console.error('❌ خطأ في جلب الأقسام:', err);
            return;
        }
        
        console.log(`📚 الأقسام المتاحة: ${sections.length} قسم`);
        sections.forEach(section => {
            console.log(`   - ${section.id}: ${section.name}`);
        });
        
        db.all(adminScheduleQuery, (err, adminEvents) => {
            if (err) {
                console.error('❌ خطأ في جلب أحداث الجدول:', err);
                return;
            }
            
            console.log(`\n📋 أحداث الجدول الزمني: ${adminEvents.length} حدث`);
            
            // تحليل المشاكل
            const problemsFound = [];
            const validSectionIds = sections.map(s => s.id);
            
            let validEvents = 0;
            let invalidSectionEvents = 0;
            let missingDataEvents = 0;
            
            adminEvents.forEach(event => {
                let hasIssues = false;
                
                // فحص القسم
                if (!event.sectionId) {
                    missingDataEvents++;
                    hasIssues = true;
                    problemsFound.push({
                        eventId: event.id,
                        issue: 'مفقود sectionId',
                        details: event
                    });
                } else if (!validSectionIds.includes(event.sectionId)) {
                    invalidSectionEvents++;
                    hasIssues = true;
                    problemsFound.push({
                        eventId: event.id,
                        issue: 'قسم غير موجود',
                        sectionId: event.sectionId,
                        details: event
                    });
                }
                
                // فحص البيانات الأساسية
                if (!event.day || !event.startTime) {
                    missingDataEvents++;
                    hasIssues = true;
                    problemsFound.push({
                        eventId: event.id,
                        issue: 'بيانات أساسية مفقودة',
                        missing: {
                            day: !event.day,
                            startTime: !event.startTime
                        },
                        details: event
                    });
                }
                
                if (!hasIssues) {
                    validEvents++;
                }
            });
            
            console.log('\n📊 تحليل النتائج:');
            console.log(`   ✅ أحداث صالحة: ${validEvents}`);
            console.log(`   ❌ أحداث بقسم غير موجود: ${invalidSectionEvents}`);
            console.log(`   ⚠️ أحداث ببيانات مفقودة: ${missingDataEvents}`);
            console.log(`   📝 إجمالي المشاكل: ${problemsFound.length}`);
            
            if (problemsFound.length > 0) {
                console.log('\n🔍 تفاصيل المشاكل:');
                problemsFound.forEach((problem, index) => {
                    console.log(`\n${index + 1}. المشكلة: ${problem.issue}`);
                    console.log(`   ID الحدث: ${problem.eventId}`);
                    if (problem.sectionId) {
                        console.log(`   القسم المفقود: ${problem.sectionId}`);
                    }
                    if (problem.missing) {
                        console.log(`   البيانات المفقودة:`, problem.missing);
                    }
                });
                
                console.log('\n💡 الحلول المقترحة:');
                console.log('1. 🔧 إصلاح معرفات الأقسام المفقودة');
                console.log('2. 🗑️ حذف الأحداث التالفة');
                console.log('3. 📝 إعادة إنشاء الأحداث المفقودة');
                
                // تطبيق الإصلاح التلقائي
                applyAutomaticFixes(adminEvents, sections, problemsFound);
                
            } else {
                console.log('\n✅ لم يتم العثور على مشاكل في البيانات');
                console.log('❓ المشكلة قد تكون في:');
                console.log('   1. 🔗 الاتصال بين Frontend و Backend');
                console.log('   2. 🎨 عرض البيانات في واجهة المستخدم');
                console.log('   3. 🔄 تحديث البيانات');
                
                // اختبار إضافي
                performAdditionalTests();
            }
        });
    });
}

function applyAutomaticFixes(adminEvents, sections, problemsFound) {
    console.log('\n🔧 تطبيق الإصلاحات التلقائية...');
    
    const validSectionIds = sections.map(s => s.id);
    const defaultSectionId = validSectionIds[0]; // استخدام أول قسم كافتراضي
    
    let fixedCount = 0;
    const fixQueries = [];
    
    problemsFound.forEach(problem => {
        const event = problem.details;
        
        if (problem.issue === 'قسم غير موجود' && defaultSectionId) {
            // إصلاح القسم المفقود
            fixQueries.push({
                query: 'UPDATE AdminScheduleEntries SET sectionId = ? WHERE id = ?',
                params: [defaultSectionId, event.id],
                description: `إصلاح القسم للحدث ${event.id}`
            });
            fixedCount++;
        } else if (problem.issue === 'مفقود sectionId' && defaultSectionId) {
            // إضافة قسم افتراضي
            fixQueries.push({
                query: 'UPDATE AdminScheduleEntries SET sectionId = ? WHERE id = ?',
                params: [defaultSectionId, event.id],
                description: `إضافة قسم افتراضي للحدث ${event.id}`
            });
            fixedCount++;
        }
    });
    
    if (fixQueries.length > 0) {
        console.log(`🛠️ تطبيق ${fixQueries.length} إصلاح...`);
        
        let completedFixes = 0;
        fixQueries.forEach(fix => {
            db.run(fix.query, fix.params, function(err) {
                completedFixes++;
                
                if (err) {
                    console.error(`❌ فشل ${fix.description}:`, err);
                } else {
                    console.log(`✅ ${fix.description}`);
                }
                
                // عند اكتمال جميع الإصلاحات
                if (completedFixes === fixQueries.length) {
                    console.log(`\n✅ تم تطبيق ${fixedCount} إصلاح بنجاح!`);
                    console.log('🔄 يُنصح بإعادة تحميل الصفحة لرؤية التحديثات');
                    
                    // فحص النتائج
                    verifyFixes();
                }
            });
        });
    } else {
        console.log('ℹ️ لا توجد إصلاحات تلقائية متاحة');
        performAdditionalTests();
    }
}

function verifyFixes() {
    console.log('\n🔍 التحقق من نتائج الإصلاح...');
    
    db.all(`
        SELECT 
            ae.*,
            s.name as sectionName
        FROM AdminScheduleEntries ae
        LEFT JOIN Sections s ON ae.sectionId = s.id
        ORDER BY ae.createdAt DESC
    `, (err, results) => {
        if (err) {
            console.error('❌ خطأ في التحقق:', err);
            return;
        }
        
        console.log(`📊 النتائج بعد الإصلاح:`);
        
        let validCount = 0;
        let stillBroken = 0;
        
        results.forEach(event => {
            if (event.day && event.startTime && event.sectionId && event.sectionName) {
                validCount++;
            } else {
                stillBroken++;
                console.log(`⚠️ حدث ما زال مكسور: ${event.id}`);
            }
        });
        
        console.log(`   ✅ أحداث صالحة: ${validCount}`);
        console.log(`   ❌ أحداث ما زالت مكسورة: ${stillBroken}`);
        
        if (validCount > 0) {
            console.log('\n🎉 الإصلاح ناجح! الأحداث يجب أن تظهر الآن');
            
            // عرض عينة من البيانات الصالحة
            console.log('\n📋 عينة من الأحداث الصالحة:');
            results.slice(0, 3).forEach((event, index) => {
                if (event.sectionName) {
                    console.log(`${index + 1}. ${event.day} ${event.startTime} - ${event.sectionName}`);
                }
            });
        }
        
        db.close();
    });
}

function performAdditionalTests() {
    console.log('\n🧪 اختبارات إضافية...');
    
    // اختبار استعلام مبسط
    db.all(`
        SELECT 
            COUNT(*) as totalEvents,
            COUNT(CASE WHEN sectionId IS NOT NULL THEN 1 END) as eventsWithSection,
            COUNT(CASE WHEN day IS NOT NULL THEN 1 END) as eventsWithDay,
            COUNT(CASE WHEN startTime IS NOT NULL THEN 1 END) as eventsWithTime
        FROM AdminScheduleEntries
    `, (err, stats) => {
        if (err) {
            console.error('❌ خطأ في الإحصائيات:', err);
            return;
        }
        
        const stat = stats[0];
        console.log('📊 إحصائيات البيانات:');
        console.log(`   إجمالي الأحداث: ${stat.totalEvents}`);
        console.log(`   أحداث بقسم: ${stat.eventsWithSection}`);
        console.log(`   أحداث بيوم: ${stat.eventsWithDay}`);
        console.log(`   أحداث بوقت: ${stat.eventsWithTime}`);
        
        db.close();
    });
}

// بدء الإصلاح
fixScheduleDisplayIssue();