const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

/**
 * نظام مراقبة التطابق بين التقويم ودفتر النصوص
 * Calendar-Textbook Synchronization Monitor
 * 
 * الهدف: ضمان أن كل درس مُخطط في التقويم له إدخال مطابق في دفتر النصوص
 */

class CalendarTextbookSyncMonitor {
    constructor(dbPath = 'classroom.db') {
        this.dbPath = dbPath;
        this.db = null;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err);
                    reject(err);
                } else {
                    console.log('✅ تم الاتصال بقاعدة البيانات');
                    resolve();
                }
            });
        });
    }

    close() {
        if (this.db) {
            this.db.close();
        }
    }

    // الحصول على الحصص المجدولة (من جدول Lessons أو أي جدول آخر يمثل التقويم)
    async getScheduledLessons() {
        return new Promise((resolve, reject) => {
            // نبحث في الجداول المختلفة لإيجاد التقويم الفعلي
            const queries = [
                // محاولة البحث في جدول Lessons
                `SELECT * FROM Lessons WHERE date IS NOT NULL ORDER BY date DESC`,
                
                // محاولة البحث في AdminScheduleEntries
                `SELECT 
                    id, day as date, startTime, sectionId, subject, teacher,
                    COALESCE(subject, 'درس غير محدد') as lesson_title
                FROM AdminScheduleEntries 
                ORDER BY day DESC`,
                
                // محاولة البحث في administrative_timetable
                `SELECT 
                    id, day as date, startTime, sectionId, classroom, teacherId,
                    'درس مجدول' as lesson_title
                FROM administrative_timetable 
                ORDER BY day DESC`
            ];

            let queryIndex = 0;
            const tryNextQuery = () => {
                if (queryIndex >= queries.length) {
                    console.log('⚠️ لم يتم العثور على جدول التقويم/الجدولة');
                    resolve([]);
                    return;
                }

                const query = queries[queryIndex];
                this.db.all(query, (err, rows) => {
                    if (!err && rows && rows.length > 0) {
                        console.log(`✅ تم العثور على ${rows.length} حصة مجدولة`);
                        resolve(rows);
                    } else {
                        queryIndex++;
                        tryNextQuery();
                    }
                });
            };

            tryNextQuery();
        });
    }

    // الحصول على إدخالات دفتر النصوص
    async getTextbookEntries() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    id, date, sectionId, lessonTitle,
                    startTime, duration, sectionName
                FROM TextbookEntries 
                ORDER BY date DESC
            `;

            this.db.all(query, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    // مقارنة التقويم مع دفتر النصوص
    async compareCalendarWithTextbook() {
        const scheduledLessons = await this.getScheduledLessons();
        const textbookEntries = await this.getTextbookEntries();

        console.log(`📅 الحصص المجدولة: ${scheduledLessons.length}`);
        console.log(`📖 إدخالات دفتر النصوص: ${textbookEntries.length}`);

        // تحويل إدخالات دفتر النصوص إلى مجموعة للبحث السريع
        const textbookMap = new Map();
        textbookEntries.forEach(entry => {
            const key = `${entry.date}-${entry.sectionId}`;
            if (!textbookMap.has(key)) {
                textbookMap.set(key, []);
            }
            textbookMap.get(key).push(entry);
        });

        // العثور على الحصص المجدولة بدون إدخالات في دفتر النصوص
        const missingTextbookEntries = [];
        const matchedLessons = [];

        scheduledLessons.forEach(lesson => {
            const lessonDate = lesson.date || lesson.day;
            const lessonSection = lesson.sectionId;
            
            if (!lessonDate || !lessonSection) return;

            const key = `${lessonDate}-${lessonSection}`;
            const textbookMatches = textbookMap.get(key) || [];

            if (textbookMatches.length === 0) {
                missingTextbookEntries.push({
                    ...lesson,
                    normalizedDate: lessonDate,
                    reason: 'لا يوجد إدخال مطابق في دفتر النصوص'
                });
            } else {
                matchedLessons.push({
                    lesson: lesson,
                    textbookEntries: textbookMatches
                });
            }
        });

        // العثور على إدخالات دفتر النصوص بدون حصص مجدولة مطابقة
        const orphanedTextbookEntries = [];
        const scheduledMap = new Map();
        
        scheduledLessons.forEach(lesson => {
            const lessonDate = lesson.date || lesson.day;
            const key = `${lessonDate}-${lesson.sectionId}`;
            scheduledMap.set(key, lesson);
        });

        textbookEntries.forEach(entry => {
            const key = `${entry.date}-${entry.sectionId}`;
            if (!scheduledMap.has(key)) {
                orphanedTextbookEntries.push({
                    ...entry,
                    reason: 'لا توجد حصة مجدولة مطابقة'
                });
            }
        });

        return {
            summary: {
                totalScheduled: scheduledLessons.length,
                totalTextbook: textbookEntries.length,
                matched: matchedLessons.length,
                missingTextbook: missingTextbookEntries.length,
                orphanedTextbook: orphanedTextbookEntries.length
            },
            details: {
                missingTextbookEntries,
                orphanedTextbookEntries,
                matchedLessons: matchedLessons.slice(0, 5) // عينة فقط
            }
        };
    }

    // فحص شامل للتطابق
    async runSyncCheck() {
        console.log('🔍 فحص التطابق بين التقويم ودفتر النصوص...\n');

        try {
            await this.connect();

            const comparison = await this.compareCalendarWithTextbook();
            
            this.printSyncReport(comparison);

            // تحديد حالة النظام
            let systemStatus = 'HEALTHY';
            if (comparison.summary.missingTextbook > 0) {
                systemStatus = 'SYNC_ISSUES';
            }
            if (comparison.summary.orphanedTextbook > 0) {
                systemStatus = 'DATA_INCONSISTENCY';
            }
            if (comparison.summary.missingTextbook > 5 || comparison.summary.orphanedTextbook > 5) {
                systemStatus = 'CRITICAL_SYNC_FAILURE';
            }

            return {
                status: systemStatus,
                ...comparison
            };

        } catch (error) {
            console.error('❌ خطأ في فحص التطابق:', error);
            throw error;
        } finally {
            this.close();
        }
    }

    // طباعة تقرير التطابق
    printSyncReport(comparison) {
        console.log('='.repeat(80));
        console.log('📊 تقرير التطابق بين التقويم ودفتر النصوص');
        console.log('='.repeat(80));

        const { summary, details } = comparison;

        // الملخص العام
        console.log(`\n📈 الملخص العام:`);
        console.log(`   📅 إجمالي الحصص المجدولة: ${summary.totalScheduled}`);
        console.log(`   📖 إجمالي إدخالات دفتر النصوص: ${summary.totalTextbook}`);
        console.log(`   ✅ متطابقة: ${summary.matched}`);
        console.log(`   ❌ حصص بدون إدخالات: ${summary.missingTextbook}`);
        console.log(`   🔍 إدخالات يتيمة: ${summary.orphanedTextbook}`);

        // حساب نسبة التطابق
        const syncRate = summary.totalScheduled > 0 
            ? ((summary.matched / summary.totalScheduled) * 100).toFixed(1)
            : '0.0';
        
        console.log(`\n📊 نسبة التطابق: ${syncRate}%`);

        // حالة النظام
        let statusEmoji = '✅';
        let statusMessage = 'النظام متطابق بالكامل';
        
        if (summary.missingTextbook > 0 || summary.orphanedTextbook > 0) {
            statusEmoji = '⚠️';
            statusMessage = 'يوجد مشاكل في التطابق';
        }
        
        if (summary.missingTextbook > 5 || summary.orphanedTextbook > 5) {
            statusEmoji = '🚨';
            statusMessage = 'مشكلة حرجة في التطابق';
        }

        console.log(`${statusEmoji} الحالة: ${statusMessage}`);

        // تفاصيل الحصص المفقودة من دفتر النصوص
        if (details.missingTextbookEntries.length > 0) {
            console.log(`\n❌ حصص مجدولة لكن مفقودة من دفتر النصوص (${details.missingTextbookEntries.length}):`);
            details.missingTextbookEntries.slice(0, 10).forEach((lesson, index) => {
                const date = lesson.normalizedDate || lesson.date || lesson.day;
                const title = lesson.lesson_title || lesson.subject || lesson.customTitle || 'درس غير محدد';
                const section = lesson.sectionId || 'قسم غير محدد';
                console.log(`   ${index + 1}. ${date} - ${section} - ${title}`);
            });
            if (details.missingTextbookEntries.length > 10) {
                console.log(`   ... و ${details.missingTextbookEntries.length - 10} حصة أخرى`);
            }
        }

        // تفاصيل الإدخالات اليتيمة
        if (details.orphanedTextbookEntries.length > 0) {
            console.log(`\n🔍 إدخالات دفتر النصوص بدون حصص مجدولة (${details.orphanedTextbookEntries.length}):`);
            details.orphanedTextbookEntries.slice(0, 5).forEach((entry, index) => {
                console.log(`   ${index + 1}. ${entry.date} - ${entry.sectionName} - ${entry.lessonTitle}`);
            });
        }

        // توصيات
        console.log('\n💡 التوصيات:');
        if (summary.missingTextbook > 0) {
            console.log('   🔧 إنشاء إدخالات دفتر النصوص للحصص المفقودة');
            console.log('   🔄 تفعيل العملية التلقائية لربط التقويم بدفتر النصوص');
        }
        if (summary.orphanedTextbook > 0) {
            console.log('   🔍 مراجعة الإدخالات اليتيمة في دفتر النصوص');
            console.log('   🗑️ حذف أو ربط الإدخالات غير المطابقة');
        }
        if (summary.missingTextbook === 0 && summary.orphanedTextbook === 0) {
            console.log('   ✅ النظام يعمل بشكل مثالي - استمر في المراقبة الدورية');
        }

        console.log('\n' + '='.repeat(80));
    }

    // إصلاح تلقائي للحصص المفقودة
    async autoFixMissingEntries(missingLessons) {
        if (missingLessons.length === 0) return;

        console.log(`🔧 بدء الإصلاح التلقائي لـ ${missingLessons.length} حصة مفقودة...`);

        let fixed = 0;
        let errors = 0;

        for (const lesson of missingLessons) {
            try {
                const lessonDate = lesson.normalizedDate || lesson.date || lesson.day;
                const lessonTitle = lesson.lesson_title || lesson.subject || lesson.customTitle || 'درس مجدول';
                const sectionId = lesson.sectionId;
                const startTime = lesson.startTime || '08:00';

                await this.createTextbookEntry({
                    date: lessonDate,
                    sectionId: sectionId,
                    lessonTitle: lessonTitle,
                    startTime: startTime,
                    duration: 1.0,
                    sectionName: sectionId, // يمكن تحسينه لاحقاً
                    lessonContent: `درس تم إنشاؤه تلقائياً من التقويم\nالموضوع: ${lessonTitle}\nالتاريخ: ${lessonDate}`,
                    isAutoGenerated: 1,
                    originalLessonId: lesson.id
                });

                fixed++;
                console.log(`   ✅ تم إصلاح: ${lessonDate} - ${lessonTitle}`);
            } catch (error) {
                errors++;
                console.error(`   ❌ خطأ في إصلاح: ${lesson.normalizedDate || lesson.date} - ${error.message}`);
            }
        }

        console.log(`\n📊 نتائج الإصلاح التلقائي:`);
        console.log(`   ✅ تم الإصلاح: ${fixed}`);
        console.log(`   ❌ الأخطاء: ${errors}`);
    }

    // إنشاء إدخال دفتر النصوص
    async createTextbookEntry(entryData) {
        return new Promise((resolve, reject) => {
            const id = `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const now = new Date().toISOString();

            const query = `
                INSERT INTO TextbookEntries (
                    id, date, startTime, duration, sectionId, sectionName,
                    lessonTitle, sessionNumber, lessonContent, 
                    isAutoGenerated, originalLessonId, createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            this.db.run(query, [
                id,
                entryData.date,
                entryData.startTime,
                entryData.duration,
                entryData.sectionId,
                entryData.sectionName,
                entryData.lessonTitle,
                1, // sessionNumber
                entryData.lessonContent,
                1, // isAutoGenerated
                entryData.originalLessonId,
                now,
                now
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id, insertedId: this.lastID });
                }
            });
        });
    }
}

// إذا تم تشغيل الملف مباشرة
if (require.main === module) {
    const monitor = new CalendarTextbookSyncMonitor();
    
    monitor.runSyncCheck()
        .then(result => {
            if (result.status !== 'HEALTHY' && result.details.missingTextbookEntries.length > 0) {
                console.log('\n🤔 هل تريد الإصلاح التلقائي؟ (سيتم إنشاء إدخالات دفتر النصوص للحصص المفقودة)');
                // في التطبيق الفعلي، يمكن إضافة prompt للموافقة
                // monitor.autoFixMissingEntries(result.details.missingTextbookEntries);
            }
        })
        .catch(console.error);
}

module.exports = CalendarTextbookSyncMonitor;