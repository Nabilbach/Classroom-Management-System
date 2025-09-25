const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

/**
 * نظام مراقبة سلامة البيانات والحماية من فقدان البيانات
 * Data Integrity Monitoring & Protection System
 */

class DataIntegrityMonitor {
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

    // فحص التطابق بين الحصص وإدخالات دفتر النصوص
    async checkLessonTextbookConsistency() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    sl.id as lesson_id,
                    sl.date,
                    sl.customTitle as lesson_title,
                    sl.subject,
                    sl.assignedSections,
                    COUNT(te.id) as textbook_entries_count,
                    CASE 
                        WHEN COUNT(te.id) = 0 THEN 'MISSING_TEXTBOOK_ENTRY'
                        WHEN COUNT(te.id) > 1 THEN 'DUPLICATE_TEXTBOOK_ENTRY'
                        ELSE 'CONSISTENT'
                    END as status
                FROM Lessons sl
                LEFT JOIN TextbookEntries te ON sl.date = te.date
                GROUP BY sl.id, sl.date, sl.customTitle, sl.subject, sl.assignedSections
                ORDER BY sl.date DESC
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

    // فحص التطابق بين الحصص وسجلات الحضور
    async checkLessonAttendanceConsistency() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    sl.id as lesson_id,
                    sl.date,
                    sl.customTitle as lesson_title,
                    sl.assignedSections,
                    COUNT(DISTINCT a.studentId) as unique_students_with_attendance,
                    COUNT(a.id) as total_attendance_records,
                    CASE 
                        WHEN COUNT(a.id) = 0 THEN 'NO_ATTENDANCE_RECORDED'
                        WHEN COUNT(DISTINCT a.studentId) < 10 THEN 'SUSPICIOUSLY_LOW_ATTENDANCE'
                        ELSE 'CONSISTENT'
                    END as status
                FROM Lessons sl
                LEFT JOIN Attendances a ON sl.date = a.date
                GROUP BY sl.id, sl.date, sl.customTitle, sl.assignedSections
                ORDER BY sl.date DESC
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

    // فحص الأيتام (Orphaned Records)
    async checkOrphanedRecords() {
        return new Promise((resolve, reject) => {
            const queries = {
                orphanedTextbookEntries: `
                    SELECT te.* FROM TextbookEntries te
                    LEFT JOIN Lessons sl ON te.date = sl.date
                    WHERE sl.id IS NULL
                `,
                orphanedAttendances: `
                    SELECT a.date, a.sectionId, COUNT(*) as count 
                    FROM Attendances a
                    LEFT JOIN Lessons sl ON a.date = sl.date
                    WHERE sl.id IS NULL
                    GROUP BY a.date, a.sectionId
                `
            };

            const results = {};
            let completed = 0;
            const total = Object.keys(queries).length;

            Object.entries(queries).forEach(([key, query]) => {
                this.db.all(query, (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    results[key] = rows;
                    completed++;
                    
                    if (completed === total) {
                        resolve(results);
                    }
                });
            });
        });
    }

    // فحص التواريخ المفقودة (Gap Detection)
    async checkDateGaps() {
        return new Promise((resolve, reject) => {
            const query = `
                WITH date_range AS (
                    SELECT date(
                        (SELECT MIN(date) FROM Lessons),
                        '+' || (ROW_NUMBER() OVER () - 1) || ' days'
                    ) as check_date
                    FROM (
                        SELECT 1 UNION SELECT 1 UNION SELECT 1 UNION SELECT 1 UNION SELECT 1 
                        UNION SELECT 1 UNION SELECT 1 UNION SELECT 1 UNION SELECT 1 UNION SELECT 1
                    ) a, (
                        SELECT 1 UNION SELECT 1 UNION SELECT 1 UNION SELECT 1 UNION SELECT 1 
                        UNION SELECT 1 UNION SELECT 1 UNION SELECT 1 UNION SELECT 1 UNION SELECT 1
                    ) b, (
                        SELECT 1 UNION SELECT 1 UNION SELECT 1 UNION SELECT 1 UNION SELECT 1
                    ) c
                    WHERE date(
                        (SELECT MIN(date) FROM Lessons),
                        '+' || (ROW_NUMBER() OVER () - 1) || ' days'
                    ) <= (SELECT MAX(date) FROM Lessons)
                )
                SELECT 
                    dr.check_date as missing_date,
                    CASE 
                        WHEN strftime('%w', dr.check_date) IN ('0', '6') THEN 'WEEKEND'
                        ELSE 'POTENTIAL_MISSING_LESSONS'
                    END as gap_type
                FROM date_range dr
                LEFT JOIN Lessons sl ON dr.check_date = sl.date
                WHERE sl.date IS NULL
                AND strftime('%w', dr.check_date) NOT IN ('0', '6')  -- استبعاد عطل الأسبوع
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
    }

    // تشغيل فحص شامل للنظام
    async runComprehensiveCheck() {
        console.log('🔍 بدء الفحص الشامل لسلامة البيانات...\n');
        
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

            // 1. فحص التطابق بين الحصص ودفتر النصوص
            console.log('📚 فحص التطابق بين الحصص ودفتر النصوص...');
            const lessonTextbookCheck = await this.checkLessonTextbookConsistency();
            report.checks.lessonTextbookConsistency = {
                issues: lessonTextbookCheck.filter(row => row.status !== 'CONSISTENT'),
                total: lessonTextbookCheck.length,
                consistent: lessonTextbookCheck.filter(row => row.status === 'CONSISTENT').length
            };

            // 2. فحص التطابق بين الحصص والحضور
            console.log('👥 فحص التطابق بين الحصص والحضور...');
            const lessonAttendanceCheck = await this.checkLessonAttendanceConsistency();
            report.checks.lessonAttendanceConsistency = {
                issues: lessonAttendanceCheck.filter(row => row.status !== 'CONSISTENT'),
                total: lessonAttendanceCheck.length,
                consistent: lessonAttendanceCheck.filter(row => row.status === 'CONSISTENT').length
            };

            // 3. فحص السجلات الأيتام
            console.log('🔍 فحص السجلات الأيتام...');
            const orphanedRecords = await this.checkOrphanedRecords();
            report.checks.orphanedRecords = orphanedRecords;

            // 4. فحص التواريخ المفقودة
            console.log('📅 فحص التواريخ المفقودة...');
            const dateGaps = await this.checkDateGaps();
            report.checks.dateGaps = dateGaps;

            // حساب الملخص
            report.summary.totalIssues = 
                report.checks.lessonTextbookConsistency.issues.length +
                report.checks.lessonAttendanceConsistency.issues.length +
                (orphanedRecords.orphanedTextbookEntries?.length || 0) +
                (orphanedRecords.orphanedAttendances?.length || 0) +
                dateGaps.length;

            report.summary.criticalIssues = 
                report.checks.lessonTextbookConsistency.issues.filter(i => i.status === 'MISSING_TEXTBOOK_ENTRY').length +
                (orphanedRecords.orphanedTextbookEntries?.length || 0);

            report.summary.warnings = 
                report.checks.lessonAttendanceConsistency.issues.filter(i => i.status === 'SUSPICIOUSLY_LOW_ATTENDANCE').length +
                dateGaps.length;

            // تحديد حالة النظام العامة
            if (report.summary.criticalIssues > 0) {
                report.summary.status = 'CRITICAL';
            } else if (report.summary.totalIssues > 0) {
                report.summary.status = 'WARNING';
            } else {
                report.summary.status = 'HEALTHY';
            }

            // طباعة التقرير
            this.printReport(report);
            
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

    // طباعة التقرير
    printReport(report) {
        console.log('\n' + '='.repeat(80));
        console.log('📊 تقرير سلامة البيانات');
        console.log('='.repeat(80));
        
        // حالة النظام العامة
        const statusEmoji = {
            'HEALTHY': '✅',
            'WARNING': '⚠️',
            'CRITICAL': '🚨'
        };
        
        console.log(`\n${statusEmoji[report.summary.status]} حالة النظام: ${report.summary.status}`);
        console.log(`📊 إجمالي المشاكل: ${report.summary.totalIssues}`);
        console.log(`🚨 المشاكل الحرجة: ${report.summary.criticalIssues}`);
        console.log(`⚠️ التحذيرات: ${report.summary.warnings}`);

        // تفاصيل فحص الحصص ودفتر النصوص
        console.log('\n📚 التطابق بين الحصص ودفتر النصوص:');
        console.log(`   ✅ متطابق: ${report.checks.lessonTextbookConsistency.consistent}/${report.checks.lessonTextbookConsistency.total}`);
        
        if (report.checks.lessonTextbookConsistency.issues.length > 0) {
            console.log('   ❌ المشاكل المكتشفة:');
            report.checks.lessonTextbookConsistency.issues.forEach((issue, index) => {
                console.log(`      ${index + 1}. ${issue.date} - ${issue.lesson_title} (${issue.status})`);
            });
        }

        // تفاصيل فحص الحضور
        console.log('\n👥 التطابق بين الحصص والحضور:');
        console.log(`   ✅ متطابق: ${report.checks.lessonAttendanceConsistency.consistent}/${report.checks.lessonAttendanceConsistency.total}`);
        
        if (report.checks.lessonAttendanceConsistency.issues.length > 0) {
            console.log('   ⚠️ المشاكل المكتشفة:');
            report.checks.lessonAttendanceConsistency.issues.forEach((issue, index) => {
                console.log(`      ${index + 1}. ${issue.date} - ${issue.lesson_title} (${issue.status})`);
            });
        }

        // السجلات الأيتام
        if (report.checks.orphanedRecords.orphanedTextbookEntries?.length > 0) {
            console.log('\n🔍 إدخالات دفتر النصوص الأيتام:');
            report.checks.orphanedRecords.orphanedTextbookEntries.forEach((orphan, index) => {
                console.log(`   ${index + 1}. ID: ${orphan.id} - ${orphan.date}`);
            });
        }

        // التواريخ المفقودة
        if (report.checks.dateGaps.length > 0) {
            console.log('\n📅 التواريخ المحتملة المفقودة:');
            report.checks.dateGaps.slice(0, 10).forEach((gap, index) => { // أول 10 فقط
                console.log(`   ${index + 1}. ${gap.missing_date}`);
            });
            if (report.checks.dateGaps.length > 10) {
                console.log(`   ... و ${report.checks.dateGaps.length - 10} تاريخ آخر`);
            }
        }

        console.log('\n' + '='.repeat(80));
    }

    // حفظ التقرير في ملف
    async saveReport(report) {
        const filename = `integrity_report_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        const filepath = path.join(this.reportPath, filename);
        
        try {
            fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
            console.log(`💾 تم حفظ التقرير في: ${filepath}`);
        } catch (error) {
            console.error('❌ خطأ في حفظ التقرير:', error);
        }
    }

    // إنشاء نسخة احتياطية طارئة
    async createEmergencyBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `emergency_backup_${timestamp}.db`;
        const backupPath = path.join('backups', backupName);

        try {
            // إنشاء مجلد النسخ الاحتياطية
            if (!fs.existsSync('backups')) {
                fs.mkdirSync('backups', { recursive: true });
            }

            // نسخ قاعدة البيانات
            fs.copyFileSync(this.dbPath, backupPath);
            
            console.log(`💾 تم إنشاء نسخة احتياطية طارئة: ${backupPath}`);
            return backupPath;
        } catch (error) {
            console.error('❌ خطأ في إنشاء النسخة الاحتياطية:', error);
            throw error;
        }
    }
}

// إذا تم تشغيل الملف مباشرة
if (require.main === module) {
    const monitor = new DataIntegrityMonitor();
    
    // تشغيل الفحص الشامل
    monitor.runComprehensiveCheck()
        .then((report) => {
            if (report.summary.status === 'CRITICAL') {
                console.log('\n🚨 تم اكتشاف مشاكل حرجة! يُنصح بإنشاء نسخة احتياطية فورية.');
                return monitor.createEmergencyBackup();
            }
        })
        .catch(console.error);
}

module.exports = DataIntegrityMonitor;