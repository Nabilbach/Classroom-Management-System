const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

/**
 * نظام مراقبة سلامة البيانات المحدث - متوافق مع البنية الحقيقية لقاعدة البيانات
 * Updated Data Integrity Monitoring System
 */

class UpdatedDataIntegrityMonitor {
    constructor(dbPath = 'classroom.db') {
        this.dbPath = dbPath;
        this.db = null;
        this.reportPath = 'data_integrity_reports';
        
        // إنشاء مجلد التقارير إذا لم يكن موجود
        if (!fs.existsSync(this.reportPath)) {
            fs.mkdirSync(this.reportPath, { recursive: true });
        }
    }

    // فتح اتصال قاعدة البيانات
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

    // إغلاق الاتصال
    close() {
        if (this.db) {
            this.db.close();
        }
    }

    // فحص حالة TextbookEntries - الجدول الرئيسي للدروس
    async checkTextbookEntriesStatus() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    date,
                    COUNT(*) as total_entries,
                    COUNT(DISTINCT sectionId) as unique_sections,
                    GROUP_CONCAT(DISTINCT sectionName) as section_names,
                    MIN(startTime) as earliest_time,
                    MAX(startTime) as latest_time
                FROM TextbookEntries
                GROUP BY date
                ORDER BY date DESC
            `;

            this.db.all(query, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // فحص التطابق بين TextbookEntries والحضور
    async checkTextbookAttendanceConsistency() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    te.date,
                    te.sectionId,
                    te.sectionName,
                    te.lessonTitle,
                    COUNT(DISTINCT a.studentId) as unique_students_with_attendance,
                    COUNT(a.id) as total_attendance_records,
                    CASE 
                        WHEN COUNT(a.id) = 0 THEN 'NO_ATTENDANCE_RECORDED'
                        WHEN COUNT(DISTINCT a.studentId) < 5 THEN 'LOW_ATTENDANCE'
                        WHEN COUNT(DISTINCT a.studentId) < 15 THEN 'MEDIUM_ATTENDANCE'
                        ELSE 'GOOD_ATTENDANCE'
                    END as attendance_status
                FROM TextbookEntries te
                LEFT JOIN Attendances a ON te.date = a.date AND te.sectionId = a.sectionId
                GROUP BY te.date, te.sectionId, te.sectionName, te.lessonTitle
                ORDER BY te.date DESC, te.sectionName
            `;

            this.db.all(query, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // فحص سجلات الحضور الأيتام (بدون دروس مطابقة)
    async checkOrphanedAttendances() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    a.date,
                    a.sectionId,
                    COUNT(*) as attendance_count,
                    GROUP_CONCAT(DISTINCT s.name) as section_name
                FROM Attendances a
                LEFT JOIN TextbookEntries te ON a.date = te.date AND a.sectionId = te.sectionId
                LEFT JOIN Sections s ON a.sectionId = s.id
                WHERE te.id IS NULL
                GROUP BY a.date, a.sectionId
                ORDER BY a.date DESC
            `;

            this.db.all(query, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // فحص فجوات التواريخ في دفتر النصوص
    async checkDateGapsInTextbook() {
        return new Promise((resolve, reject) => {
            // أولاً نحصل على نطاق التواريخ
            this.db.get(`SELECT MIN(date) as min_date, MAX(date) as max_date FROM TextbookEntries`, (err, range) => {
                if (err || !range) {
                    reject(err || new Error('لا توجد بيانات في TextbookEntries'));
                    return;
                }

                const query = `
                    WITH RECURSIVE date_range(check_date) AS (
                        SELECT date('${range.min_date}') as check_date
                        UNION ALL
                        SELECT date(check_date, '+1 day')
                        FROM date_range
                        WHERE check_date < date('${range.max_date}')
                    )
                    SELECT 
                        dr.check_date as missing_date,
                        strftime('%w', dr.check_date) as day_of_week,
                        CASE 
                            WHEN strftime('%w', dr.check_date) IN ('0', '6') THEN 'WEEKEND'
                            ELSE 'POTENTIAL_MISSING_LESSON'
                        END as gap_type
                    FROM date_range dr
                    LEFT JOIN TextbookEntries te ON dr.check_date = te.date
                    WHERE te.date IS NULL
                    AND strftime('%w', dr.check_date) NOT IN ('0', '6')
                    ORDER BY dr.check_date
                `;

                this.db.all(query, (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
        });
    }

    // فحص جودة البيانات في TextbookEntries
    async checkDataQuality() {
        return new Promise((resolve, reject) => {
            const qualityChecks = {
                emptyContent: `
                    SELECT COUNT(*) as count FROM TextbookEntries 
                    WHERE lessonContent IS NULL OR lessonContent = '' OR length(lessonContent) < 10
                `,
                missingTitles: `
                    SELECT COUNT(*) as count FROM TextbookEntries 
                    WHERE lessonTitle IS NULL OR lessonTitle = ''
                `,
                invalidDurations: `
                    SELECT COUNT(*) as count FROM TextbookEntries 
                    WHERE duration IS NULL OR duration <= 0 OR duration > 8
                `,
                futureDates: `
                    SELECT COUNT(*) as count FROM TextbookEntries 
                    WHERE date > date('now', '+1 day')
                `,
                duplicateEntries: `
                    SELECT date, sectionId, COUNT(*) as duplicates
                    FROM TextbookEntries 
                    GROUP BY date, sectionId, startTime
                    HAVING COUNT(*) > 1
                `
            };

            const results = {};
            let completed = 0;
            const total = Object.keys(qualityChecks).length;

            Object.entries(qualityChecks).forEach(([key, query]) => {
                if (key === 'duplicateEntries') {
                    this.db.all(query, (err, rows) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        results[key] = rows;
                        completed++;
                        if (completed === total) resolve(results);
                    });
                } else {
                    this.db.get(query, (err, result) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        results[key] = result?.count || 0;
                        completed++;
                        if (completed === total) resolve(results);
                    });
                }
            });
        });
    }

    // تشغيل فحص شامل محدث
    async runComprehensiveCheck() {
        console.log('🔍 بدء الفحص الشامل المحدث لسلامة البيانات...\n');
        
        const report = {
            timestamp: new Date().toISOString(),
            checks: {},
            summary: {
                totalIssues: 0,
                criticalIssues: 0,
                warnings: 0,
                status: 'UNKNOWN'
            }
        };

        try {
            await this.connect();

            // 1. فحص حالة دفتر النصوص
            console.log('📖 فحص حالة دفتر النصوص...');
            const textbookStatus = await this.checkTextbookEntriesStatus();
            report.checks.textbookStatus = textbookStatus;

            // 2. فحص التطابق مع الحضور
            console.log('👥 فحص التطابق مع سجلات الحضور...');
            const attendanceConsistency = await this.checkTextbookAttendanceConsistency();
            report.checks.attendanceConsistency = {
                details: attendanceConsistency,
                noAttendance: attendanceConsistency.filter(row => row.attendance_status === 'NO_ATTENDANCE_RECORDED').length,
                lowAttendance: attendanceConsistency.filter(row => row.attendance_status === 'LOW_ATTENDANCE').length
            };

            // 3. فحص سجلات الحضور الأيتام
            console.log('🔍 فحص سجلات الحضور الأيتام...');
            const orphanedAttendances = await this.checkOrphanedAttendances();
            report.checks.orphanedAttendances = orphanedAttendances;

            // 4. فحص فجوات التواريخ
            console.log('📅 فحص فجوات التواريخ...');
            try {
                const dateGaps = await this.checkDateGapsInTextbook();
                report.checks.dateGaps = dateGaps;
            } catch (error) {
                console.warn('⚠️ تعذر فحص فجوات التواريخ:', error.message);
                report.checks.dateGaps = [];
            }

            // 5. فحص جودة البيانات
            console.log('🔧 فحص جودة البيانات...');
            const dataQuality = await this.checkDataQuality();
            report.checks.dataQuality = dataQuality;

            // حساب الملخص
            report.summary.criticalIssues = 
                report.checks.orphanedAttendances.length +
                (dataQuality.duplicateEntries?.length || 0);

            report.summary.warnings = 
                report.checks.attendanceConsistency.noAttendance +
                report.checks.attendanceConsistency.lowAttendance +
                (report.checks.dateGaps?.length || 0) +
                dataQuality.emptyContent +
                dataQuality.missingTitles;

            report.summary.totalIssues = report.summary.criticalIssues + report.summary.warnings;

            // تحديد حالة النظام العامة
            if (report.summary.criticalIssues > 0) {
                report.summary.status = 'CRITICAL';
            } else if (report.summary.warnings > 5) {
                report.summary.status = 'WARNING';
            } else if (report.summary.warnings > 0) {
                report.summary.status = 'MINOR_ISSUES';
            } else {
                report.summary.status = 'HEALTHY';
            }

            // طباعة التقرير
            this.printUpdatedReport(report);
            
            // حفظ التقرير
            await this.saveReport(report);

            return report;

        } catch (error) {
            console.error('❌ خطأ في الفحص الشامل:', error);
            throw error;
        } finally {
            this.close();
        }
    }

    // طباعة التقرير المحدث
    printUpdatedReport(report) {
        console.log('\n' + '='.repeat(80));
        console.log('📊 تقرير سلامة البيانات المحدث');
        console.log('='.repeat(80));
        
        // حالة النظام العامة
        const statusEmoji = {
            'HEALTHY': '✅',
            'MINOR_ISSUES': '🔵',
            'WARNING': '⚠️',
            'CRITICAL': '🚨'
        };
        
        console.log(`\n${statusEmoji[report.summary.status]} حالة النظام: ${report.summary.status}`);
        console.log(`📊 إجمالي المشاكل: ${report.summary.totalIssues}`);
        console.log(`🚨 المشاكل الحرجة: ${report.summary.criticalIssues}`);
        console.log(`⚠️ التحذيرات: ${report.summary.warnings}`);

        // تفاصيل دفتر النصوص
        console.log('\n📖 حالة دفتر النصوص:');
        if (report.checks.textbookStatus.length > 0) {
            console.log(`   📅 إجمالي الأيام المسجلة: ${report.checks.textbookStatus.length}`);
            console.log(`   📚 إجمالي الدروس: ${report.checks.textbookStatus.reduce((sum, day) => sum + day.total_entries, 0)}`);
            
            console.log('\n   تفاصيل الأيام الأخيرة:');
            report.checks.textbookStatus.slice(0, 5).forEach((day, index) => {
                console.log(`      ${index + 1}. ${day.date}: ${day.total_entries} درس، ${day.unique_sections} قسم`);
            });
        } else {
            console.log('   ❌ لا توجد دروس مسجلة في دفتر النصوص!');
        }

        // مشاكل الحضور
        if (report.checks.attendanceConsistency.noAttendance > 0) {
            console.log(`\n👥 دروس بدون حضور: ${report.checks.attendanceConsistency.noAttendance}`);
        }
        if (report.checks.attendanceConsistency.lowAttendance > 0) {
            console.log(`⚠️ دروس بحضور منخفض: ${report.checks.attendanceConsistency.lowAttendance}`);
        }

        // السجلات الأيتام
        if (report.checks.orphanedAttendances.length > 0) {
            console.log(`\n🔍 سجلات حضور يتيمة: ${report.checks.orphanedAttendances.length}`);
            report.checks.orphanedAttendances.slice(0, 3).forEach((orphan, index) => {
                console.log(`   ${index + 1}. ${orphan.date} - ${orphan.section_name}: ${orphan.attendance_count} سجل`);
            });
        }

        // فجوات التواريخ
        if (report.checks.dateGaps && report.checks.dateGaps.length > 0) {
            console.log(`\n📅 تواريخ مفقودة محتملة: ${report.checks.dateGaps.length}`);
            if (report.checks.dateGaps.length <= 5) {
                report.checks.dateGaps.forEach((gap, index) => {
                    console.log(`   ${index + 1}. ${gap.missing_date}`);
                });
            } else {
                console.log(`   من ${report.checks.dateGaps[0].missing_date} إلى ${report.checks.dateGaps[report.checks.dateGaps.length - 1].missing_date}`);
            }
        }

        // جودة البيانات
        const quality = report.checks.dataQuality;
        if (quality.emptyContent > 0 || quality.missingTitles > 0) {
            console.log('\n🔧 مشاكل جودة البيانات:');
            if (quality.emptyContent > 0) console.log(`   📝 محتوى فارغ: ${quality.emptyContent}`);
            if (quality.missingTitles > 0) console.log(`   📌 عناوين مفقودة: ${quality.missingTitles}`);
            if (quality.invalidDurations > 0) console.log(`   ⏱️ مدد غير صحيحة: ${quality.invalidDurations}`);
            if (quality.futureDates > 0) console.log(`   📅 تواريخ مستقبلية: ${quality.futureDates}`);
        }

        console.log('\n' + '='.repeat(80));
    }

    // حفظ التقرير في ملف
    async saveReport(report) {
        const filename = `updated_integrity_report_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        const filepath = path.join(this.reportPath, filename);
        
        try {
            fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
            console.log(`💾 تم حفظ التقرير في: ${filepath}`);
        } catch (error) {
            console.error('❌ خطأ في حفظ التقرير:', error);
        }
    }
}

// إذا تم تشغيل الملف مباشرة
if (require.main === module) {
    const monitor = new UpdatedDataIntegrityMonitor();
    
    // تشغيل الفحص الشامل
    monitor.runComprehensiveCheck()
        .catch(console.error);
}

module.exports = UpdatedDataIntegrityMonitor;