const fs = require('fs');const fs = require('fs');#!/usr/bin/env node#!/usr/bin/env node#!/usr/bin/env node#!/usr/bin/env node

const path = require('path');

const path = require('path');

class BackupMonitoringService {

    constructor() {/*

        this.logFile = './backup_monitoring.log';

        console.log('🔍 Starting Advanced Monitoring Service...');console.log('🔍 Starting Advanced Monitoring Service...');

    }

 * Advanced Backup and Data Integrity Monitoring Service/**

    async performHealthCheck() {

        console.log('\n🏥 Performing System Health Check...');// Check if database file exists

        console.log('═'.repeat(50));

if (fs.existsSync('./classroom.db')) { */

        const report = {

            timestamp: new Date().toISOString(),    const stats = fs.statSync('./classroom.db');

            status: 'healthy',

            issues: [],    const sizeMB = (stats.size / 1024 / 1024).toFixed(2); * خدمة المراقبة المتقدمة للنسخ الاحتياطي وسلامة البيانات/**/**

            warnings: []

        };    console.log(`✅ Database found: ${sizeMB} MB`);



        // Check database file} else {const fs = require('fs');

        this.checkDatabase(report);

            console.log('❌ Database file not found!');

        // Check backups

        this.checkBackups(report);}const path = require('path'); * Advanced Backup and Data Integrity Monitoring Service

        

        // Check backend connectivity

        await this.checkBackend(report);

// Check backup directory

        // Print results

        this.printReport(report);const backupDir = './automated_backups';

        

        // Log the eventif (fs.existsSync(backupDir)) {// Import models with error handling */ * خدمة المراقبة المتقدمة للنسخ الاحتياطي وسلامة البيانات * خدمة مراقبة النسخ الاحتياطية

        this.logEvent('HEALTH_CHECK_COMPLETED', report.status);

            const backups = fs.readdirSync(backupDir).filter(name => 

        return report;

    }        fs.statSync(path.join(backupDir, name)).isDirectory()let Attendance, Student, Section;



    checkDatabase(report) {    );

        if (fs.existsSync('./classroom.db')) {

            const stats = fs.statSync('./classroom.db');    console.log(`✅ Backup check: ${backups.length} backups found`);try {

            const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

            console.log(`✅ Database: ${sizeMB} MB - OK`);    

        } else {

            console.log('❌ Database: File not found!');    if (backups.length > 0) {    const models = require('./backend/models');

            report.issues.push('Database file missing');

            report.status = 'critical';        const latest = backups[backups.length - 1];

        }

    }        const latestPath = path.join(backupDir, latest);    Attendance = models.Attendance;const fs = require('fs'); * Advanced Backup and Data Integrity Monitoring Service * Backup Monitoring Service - مراقبة وإنذار عند فشل النسخ



    checkBackups(report) {        const created = fs.statSync(latestPath).birthtime;

        const backupDir = './automated_backups';

                const hoursAgo = Math.round((Date.now() - created.getTime()) / 1000 / 60 / 60);    Student = models.Student;

        if (fs.existsSync(backupDir)) {

            try {        console.log(`📅 Latest backup: ${latest} (${hoursAgo} hours ago)`);

                const backups = fs.readdirSync(backupDir)

                    .filter(name => fs.statSync(path.join(backupDir, name)).isDirectory())    }    Section = models.Section;const path = require('path');

                    .sort();

} else {

                if (backups.length > 0) {

                    const latest = backups[backups.length - 1];    console.log('❌ Backup directory not found!');} catch (error) {

                    const latestPath = path.join(backupDir, latest);

                    const created = fs.statSync(latestPath).birthtime;}

                    const hoursAgo = Math.round((Date.now() - created.getTime()) / (1000 * 60 * 60));

                        console.log('⚠️ Cannot connect to database:', error.message); */ */

                    console.log(`✅ Backups: ${backups.length} available, latest ${hoursAgo}h ago`);

                    // Check backend models

                    if (hoursAgo > 8) {

                        report.warnings.push(`Latest backup is ${hoursAgo} hours old`);try {}

                        report.status = 'warning';

                    }    const models = require('./backend/models');

                } else {

                    console.log('⚠️ Backups: Directory exists but no backups found');    console.log('✅ Backend models accessible');// استيراد النماذج مع معالجة الأخطاء

                    report.warnings.push('No backups found');

                    report.status = 'warning';    

                }

            } catch (error) {    // Quick database stats if possibleclass BackupMonitoringService {

                console.log(`❌ Backups: Error reading directory - ${error.message}`);

                report.issues.push('Backup directory read error');    if (models.Student && models.Attendance && models.Section) {

                report.status = 'critical';

            }        Promise.all([    constructor() {let Attendance, Student, Section;

        } else {

            console.log('❌ Backups: Directory not found!');            models.Student.count(),

            report.issues.push('Backup directory missing');

            report.status = 'critical';            models.Attendance.count(),         this.logFile = './backup_monitoring.log';

        }

    }            models.Section.count()



    async checkBackend(report) {        ]).then(([students, attendance, sections]) => {        this.alertThresholds = {try {

        try {

            const models = require('./backend/models');            console.log(`📊 Database stats: ${students} students, ${attendance} attendance records, ${sections} sections`);

            

            if (models.Student && models.Attendance && models.Section) {            console.log('✅ System health check completed');            maxMissedBackups: 2,

                console.log('✅ Backend: Models accessible');

                        }).catch(error => {

                try {

                    const [students, attendance, sections] = await Promise.all([            console.log('⚠️ Could not get database stats:', error.message);            maxDataLoss: 50,    const models = require('./backend/models');const fs = require('fs');const fs = require('fs');

                        models.Student.count(),

                        models.Attendance.count(),            console.log('✅ Basic system check completed');

                        models.Section.count()

                    ]);        });            maxTimeSinceBackup: 8 * 60 * 60 * 1000 // 8 hours

                    

                    console.log(`📊 Data: ${students} students, ${attendance} records, ${sections} sections`);    } else {

                } catch (dbError) {

                    console.log(`⚠️ Backend: Models accessible but database query failed - ${dbError.message}`);        console.log('⚠️ Models not fully available');        };    Attendance = models.Attendance;

                    report.warnings.push('Database query failed');

                }        console.log('✅ Basic system check completed');

            } else {

                console.log('⚠️ Backend: Models partially loaded');    }        

                report.warnings.push('Backend models incomplete');

            }} catch (error) {

        } catch (error) {

            console.log(`❌ Backend: Cannot access models - ${error.message}`);    console.log('⚠️ Cannot access backend models:', error.message);        this.initializeMonitoring();    Student = models.Student;const path = require('path');const path = require('path');

            report.warnings.push('Backend models inaccessible');

        }    console.log('✅ Basic file system check completed');

    }

}    }

    printReport(report) {

        console.log('\n═'.repeat(50));

        

        const statusEmoji = {// Log the check    Section = models.Section;

            'healthy': '✅',

            'warning': '⚠️',const logEntry = {

            'critical': '🚨'

        };    timestamp: new Date().toISOString(),    initializeMonitoring() {



        console.log(`${statusEmoji[report.status]} System Status: ${report.status.toUpperCase()}`);    type: 'HEALTH_CHECK',

        

        if (report.issues.length > 0) {    status: 'completed'        console.log('🔍 Starting Advanced Monitoring Service...');} catch (error) {

            console.log('\n🚨 Critical Issues:');

            report.issues.forEach(issue => console.log(`   • ${issue}`));};

        }

                this.logEvent('SERVICE_STARTED', 'Monitoring service activated');

        if (report.warnings.length > 0) {

            console.log('\n⚠️ Warnings:');try {

            report.warnings.forEach(warning => console.log(`   • ${warning}`));

        }    fs.appendFileSync('./backup_monitoring.log', JSON.stringify(logEntry) + '\n');            console.log('⚠️ لا يمكن الاتصال بقاعدة البيانات:', error.message);

        

        console.log('\n═'.repeat(50));} catch (error) {

    }

    console.log('⚠️ Could not write to log file');        // Immediate check on startup

    logEvent(type, status, data = {}) {

        const logEntry = {}

            timestamp: new Date().toISOString(),        this.performHealthCheck();}// استيراد النماذج مع معالجة الأخطاءclass BackupMonitoringService {

            type,

            status,        

            data

        };        // Schedule periodic checks if in continuous mode



        try {        if (process.argv[2] === 'start') {

            fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');

        } catch (error) {            this.schedulePeriodicChecks();class BackupMonitoringService {let Attendance, Student, Section;    constructor() {

            console.log(`⚠️ Could not write to log: ${error.message}`);

        }        }

    }

    }    constructor() {

    showStats() {

        console.log('\n📊 Monitoring Statistics');

        console.log('═'.repeat(30));

            schedulePeriodicChecks() {        this.logFile = './backup_monitoring.log';try {        this.logPath = './backup_service.log';

        if (fs.existsSync(this.logFile)) {

            try {        // Check every 30 minutes

                const content = fs.readFileSync(this.logFile, 'utf-8');

                const lines = content.trim().split('\n').filter(line => line);        setInterval(() => {        this.alertThresholds = {

                

                console.log(`📝 Total log entries: ${lines.length}`);            this.performHealthCheck();

                

                if (lines.length > 0) {        }, 30 * 60 * 1000);            maxMissedBackups: 2, // إذا فشل النسخ أكثر من مرتين    const models = require('./backend/models');        this.alertThreshold = 2 * 60 * 60 * 1000; // تنبيه إذا لم يتم النسخ لأكثر من 2 ساعة

                    const events = lines.map(line => JSON.parse(line));

                    const today = new Date().toISOString().split('T')[0];

                    const todayEvents = events.filter(e => e.timestamp.startsWith(today));

                            // Check backups every hour            maxDataLoss: 50,     // إذا فقدت أكثر من 50 سجل

                    console.log(`📅 Today's events: ${todayEvents.length}`);

                            setInterval(() => {

                    const eventTypes = {};

                    todayEvents.forEach(event => {            this.checkBackupHealth();            maxTimeSinceBackup: 8 * 60 * 60 * 1000 // 8 ساعات    Attendance = models.Attendance;        this.initializeMonitoring();

                        eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;

                    });        }, 60 * 60 * 1000);

                    

                    console.log('🔍 Event breakdown:');        };

                    Object.entries(eventTypes).forEach(([type, count]) => {

                        console.log(`   ${type}: ${count}`);        // Check data integrity every 2 hours

                    });

                }        setInterval(() => {            Student = models.Student;    }

            } catch (error) {

                console.log(`⚠️ Error reading log file: ${error.message}`);            this.checkDataIntegrity();

            }

        } else {        }, 2 * 60 * 60 * 1000);        this.initializeMonitoring();

            console.log('📝 No log file found');

        }

    }

}        console.log('⏰ Periodic checks scheduled');    }    Section = models.Section;



// Command line interface    }

if (require.main === module) {

    const service = new BackupMonitoringService();

    const command = process.argv[2] || 'help';

        async performHealthCheck() {

    switch (command) {

        case 'check':        console.log('\n🏥 Starting comprehensive health check...');    /**} catch (error) {    /**

            service.performHealthCheck()

                .then(() => process.exit(0))        

                .catch(error => {

                    console.error('Health check failed:', error);        const healthReport = {     * تهيئة خدمة المراقبة

                    process.exit(1);

                });            timestamp: new Date().toISOString(),

            break;

                        status: 'healthy',     */    console.log('⚠️ لا يمكن الاتصال بقاعدة البيانات:', error.message);     * تهيئة خدمة المراقبة

        case 'stats':

            service.showStats();            issues: [],

            process.exit(0);

            break;            warnings: [],    initializeMonitoring() {

            

        case 'start':            recommendations: []

            console.log('🔄 Starting continuous monitoring...');

            console.log('Press Ctrl+C to stop');        };        console.log('🔍 بدء تشغيل خدمة المراقبة المتقدمة...');}     */

            

            // Initial check

            service.performHealthCheck();

                    try {        this.logEvent('SERVICE_STARTED', 'تم تفعيل خدمة المراقبة');

            // Schedule regular checks every 30 minutes

            const interval = setInterval(() => {            // 1. Check database health

                service.performHealthCheck();

            }, 30 * 60 * 1000);            await this.checkDatabaseHealth(healthReport);            initializeMonitoring() {

            

            // Handle graceful shutdown            

            process.on('SIGINT', () => {

                console.log('\n🛑 Stopping monitoring service...');            // 2. Check backup health        // فحص فوري عند البدء

                clearInterval(interval);

                service.logEvent('SERVICE_STOPPED', 'stopped');            await this.checkBackupHealth(healthReport);

                process.exit(0);

            });                    this.performHealthCheck();class BackupMonitoringService {        console.log('👁️ تم تفعيل خدمة مراقبة النسخ الاحتياطية');

            break;

                        // 3. Check data integrity

        default:

            console.log('\n🔍 Backup Monitoring Service');            await this.checkDataIntegrity(healthReport);        

            console.log('Usage:');

            console.log('  node backup_monitoring_service.cjs check  - Run health check');            

            console.log('  node backup_monitoring_service.cjs stats  - Show statistics');

            console.log('  node backup_monitoring_service.cjs start  - Start continuous monitoring');            // 4. Check disk space        // جدولة الفحوصات الدورية إذا كان في وضع التشغيل المستمر    constructor() {        this.startPeriodicCheck();

            process.exit(0);

    }            await this.checkDiskSpace(healthReport);

}

                    if (process.argv[2] === 'start') {

module.exports = BackupMonitoringService;
            // 5. Evaluate overall health

            this.evaluateOverallHealth(healthReport);            this.schedulePeriodicChecks();        this.logFile = './backup_monitoring.log';    }

            

            // 6. Process report and send alerts        }

            await this.processHealthReport(healthReport);

    }        this.alertThresholds = {

        } catch (error) {

            console.error('❌ Health check error:', error);

            this.logEvent('HEALTH_CHECK_ERROR', `Check error: ${error.message}`);

        }    /**            maxMissedBackups: 2, // إذا فشل النسخ أكثر من مرتين    /**

    }

     * جدولة الفحوصات الدورية

    async checkDatabaseHealth(report) {

        try {     */            maxDataLoss: 50,     // إذا فقدت أكثر من 50 سجل     * بدء الفحص الدوري

            // Check for main database file

            if (!fs.existsSync('./classroom.db')) {    schedulePeriodicChecks() {

                report.issues.push({

                    type: 'CRITICAL',        // فحص كل 30 دقيقة            maxTimeSinceBackup: 8 * 60 * 60 * 1000 // 8 ساعات     */

                    message: 'Main database file missing!',

                    severity: 'critical'        setInterval(() => {

                });

                return;            this.performHealthCheck();        };    startPeriodicCheck() {

            }

        }, 30 * 60 * 1000);

            // Check database statistics if models available

            if (Student && Attendance && Section) {                // فحص كل 30 دقيقة

                const totalStudents = await Student.count();

                const totalAttendance = await Attendance.count();        // فحص النسخ الاحتياطية كل ساعة

                const totalSections = await Section.count();

        setInterval(() => {        this.initializeMonitoring();        setInterval(() => {

                console.log(`📊 Stats: ${totalStudents} students, ${totalAttendance} attendance records, ${totalSections} sections`);

            this.checkBackupHealth();

                report.databaseStats = {

                    totalStudents,        }, 60 * 60 * 1000);    }            this.checkBackupHealth();

                    totalAttendance,

                    totalSections

                };

            } else {        // فحص سلامة البيانات كل ساعتين        }, 30 * 60 * 1000);

                report.warnings.push({

                    type: 'DATABASE_CONNECTION',        setInterval(() => {

                    message: 'Cannot connect to database for statistics',

                    severity: 'medium'            this.checkDataIntegrity();    /**

                });

            }        }, 2 * 60 * 60 * 1000);



        } catch (error) {     * تهيئة خدمة المراقبة        // فحص فوري

            report.issues.push({

                type: 'DATABASE_ERROR',        console.log('⏰ تم جدولة الفحوصات الدورية');

                message: `Database connection error: ${error.message}`,

                severity: 'high'    }     */        setTimeout(() => {

            });

        }

    }

    /**    initializeMonitoring() {            this.checkBackupHealth();

    async checkBackupHealth(report = null) {

        const isStandaloneCheck = !report;     * فحص شامل للنظام

        if (isStandaloneCheck) {

            report = { issues: [], warnings: [], recommendations: [] };     */        console.log('🔍 بدء تشغيل خدمة المراقبة المتقدمة...');        }, 5000);

        }

    async performHealthCheck() {

        try {

            const backupDir = './automated_backups';        console.log('\n🏥 بدء الفحص الصحي الشامل...');        this.logEvent('SERVICE_STARTED', 'تم تفعيل خدمة المراقبة');    }

            

            if (!fs.existsSync(backupDir)) {        

                report.issues.push({

                    type: 'NO_BACKUP_DIRECTORY',        const healthReport = {        

                    message: 'Backup directory does not exist',

                    severity: 'high'            timestamp: new Date().toISOString(),

                });

                return;            status: 'healthy',        // فحص فوري عند البدء    /**

            }

            issues: [],

            const backups = fs.readdirSync(backupDir)

                .filter(name => fs.statSync(path.join(backupDir, name)).isDirectory())            warnings: [],        this.performHealthCheck();     * فحص صحة النسخ الاحتياطية

                .map(name => ({

                    name,            recommendations: []

                    path: path.join(backupDir, name),

                    created: fs.statSync(path.join(backupDir, name)).birthtime        };             */

                }))

                .sort((a, b) => b.created - a.created);



            if (backups.length === 0) {        try {        // جدولة الفحوصات الدورية إذا كان في وضع التشغيل المستمر    async checkBackupHealth() {

                report.issues.push({

                    type: 'NO_BACKUPS',            // 1. فحص قاعدة البيانات

                    message: 'No backups found!',

                    severity: 'critical'            await this.checkDatabaseHealth(healthReport);        if (process.argv[2] === 'start') {        console.log('🔍 فحص صحة النسخ الاحتياطية...');

                });

                return;            

            }

            // 2. فحص النسخ الاحتياطية            this.schedulePeriodicChecks();        

            const latestBackup = backups[0];

            const timeSinceLastBackup = Date.now() - latestBackup.created.getTime();            await this.checkBackupHealth(healthReport);



            // Check age of latest backup                    }        try {

            if (timeSinceLastBackup > this.alertThresholds.maxTimeSinceBackup) {

                report.issues.push({            // 3. فحص سلامة البيانات

                    type: 'OLD_BACKUP',

                    message: `Latest backup is old: ${Math.round(timeSinceLastBackup / 1000 / 60 / 60)} hours`,            await this.checkDataIntegrity(healthReport);    }            // فحص آخر نسخة احتياطية

                    severity: 'medium'

                });            

            }

            // 4. فحص مساحة القرص            const lastBackup = this.getLastBackupTime();

            // Check integrity of latest backup

            const reportPath = path.join(latestBackup.path, 'backup_report.json');            await this.checkDiskSpace(healthReport);

            if (fs.existsSync(reportPath)) {

                try {                /**            const timeSinceLastBackup = Date.now() - lastBackup;

                    const backupReport = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

                    if (backupReport.status !== 'completed') {            // 5. تقييم الحالة العامة

                        report.issues.push({

                            type: 'INCOMPLETE_BACKUP',            this.evaluateOverallHealth(healthReport);     * جدولة الفحوصات الدورية            

                            message: 'Latest backup is incomplete',

                            severity: 'medium'            

                        });

                    }            // 6. حفظ التقرير وإرسال التنبيهات     */            if (timeSinceLastBackup > this.alertThreshold) {

                } catch (error) {

                    report.warnings.push({            await this.processHealthReport(healthReport);

                        type: 'BACKUP_REPORT_ERROR',

                        message: `Error reading backup report: ${error.message}`,    schedulePeriodicChecks() {                this.sendAlert('BACKUP_OVERDUE', {

                        severity: 'low'

                    });        } catch (error) {

                }

            }            console.error('❌ خطأ في الفحص الصحي:', error);        // فحص كل 30 دقيقة                    lastBackup: new Date(lastBackup).toLocaleString('ar-SA'),



            console.log(`✅ Backup check: ${backups.length} backups available`);            this.logEvent('HEALTH_CHECK_ERROR', `خطأ في الفحص: ${error.message}`);



            if (isStandaloneCheck && report.issues.length > 0) {        }        setInterval(() => {                    hoursOverdue: Math.round(timeSinceLastBackup / (60 * 60 * 1000))

                console.log('⚠️ Backup issues:', report.issues);

            }    }



        } catch (error) {            this.performHealthCheck();                });

            report.issues.push({

                type: 'BACKUP_CHECK_ERROR',    /**

                message: `Backup check error: ${error.message}`,

                severity: 'medium'     * فحص صحة قاعدة البيانات        }, 30 * 60 * 1000);            }

            });

        }     */

    }

    async checkDatabaseHealth(report) {

    async checkDataIntegrity(report = null) {

        const isStandaloneCheck = !report;        try {

        if (isStandaloneCheck) {

            report = { issues: [], warnings: [], recommendations: [] };            // التحقق من وجود ملف قاعدة البيانات        // فحص النسخ الاحتياطية كل ساعة            // فحص سلامة قاعدة البيانات الرئيسية

        }

            if (!fs.existsSync('./classroom.db')) {

        try {

            // Check data integrity if models available                report.issues.push({        setInterval(() => {            await this.checkDatabaseIntegrity();

            if (Section && Student && Attendance) {

                // Check sections without records                    type: 'CRITICAL',

                const sections = await Section.findAll({

                    include: [{                    message: 'ملف قاعدة البيانات الرئيسي مفقود!',            this.checkBackupHealth();

                        model: Student,

                        include: [{                    severity: 'critical'

                            model: Attendance,

                            required: false                });        }, 60 * 60 * 1000);            // فحص مساحة القرص

                        }]

                    }]                return;

                });

            }            this.checkDiskSpace();

                let sectionsWithoutRecords = 0;

                sections.forEach(section => {

                    const studentsWithoutRecords = section.Students.filter(student => 

                        student.Attendances.length === 0            // فحص إحصائيات قاعدة البيانات إذا كانت النماذج متوفرة        // فحص سلامة البيانات كل ساعتين

                    ).length;

            if (Student && Attendance && Section) {

                    if (studentsWithoutRecords > 0) {

                        sectionsWithoutRecords++;                const totalStudents = await Student.count();        setInterval(() => {            // فحص النسخ الاحتياطية المتاحة

                        if (studentsWithoutRecords === section.Students.length) {

                            report.warnings.push({                const totalAttendance = await Attendance.count();

                                type: 'SECTION_NO_RECORDS',

                                message: `Section ${section.name} has no attendance records`,                const totalSections = await Section.count();            this.checkDataIntegrity();            this.validateAvailableBackups();

                                severity: 'medium'

                            });

                        }

                    }                console.log(`📊 الإحصائيات: ${totalStudents} طالب، ${totalAttendance} سجل حضور، ${totalSections} قسم`);        }, 2 * 60 * 60 * 1000);

                });



                console.log(`🔍 Data integrity check: ${sectionsWithoutRecords} sections need review`);

            } else {                report.databaseStats = {            console.log('✅ فحص النسخ الاحتياطية مكتمل');

                report.warnings.push({

                    type: 'DATA_INTEGRITY_SKIP',                    totalStudents,

                    message: 'Data integrity check skipped - cannot connect to database',

                    severity: 'low'                    totalAttendance,        console.log('⏰ تم جدولة الفحوصات الدورية');

                });

            }                    totalSections



        } catch (error) {                };    }        } catch (error) {

            report.issues.push({

                type: 'DATA_INTEGRITY_ERROR',            } else {

                message: `Data integrity check error: ${error.message}`,

                severity: 'medium'                report.warnings.push({            this.sendAlert('MONITOR_ERROR', { error: error.message });

            });

        }                    type: 'DATABASE_CONNECTION',

    }

                    message: 'لا يمكن الاتصال بقاعدة البيانات لفحص الإحصائيات',    /**        }

    async checkDiskSpace(report) {

        try {                    severity: 'medium'

            if (fs.existsSync('./classroom.db')) {

                const stats = fs.statSync('./classroom.db');                });     * فحص شامل للنظام    }

                const dbSizeMB = stats.size / 1024 / 1024;

            }

                if (dbSizeMB > 100) { // If database exceeds 100 MB

                    report.recommendations.push({     */

                        type: 'LARGE_DATABASE',

                        message: `Database size is large: ${dbSizeMB.toFixed(2)} MB`,        } catch (error) {

                        severity: 'low'

                    });            report.issues.push({    async performHealthCheck() {    /**

                }

                type: 'DATABASE_ERROR',

                console.log(`💾 Database size: ${dbSizeMB.toFixed(2)} MB`);

            } else {                message: `خطأ في الاتصال بقاعدة البيانات: ${error.message}`,        console.log('\n🏥 بدء الفحص الصحي الشامل...');     * الحصول على وقت آخر نسخة احتياطية

                report.warnings.push({

                    type: 'NO_DATABASE_FILE',                severity: 'high'

                    message: 'Database file does not exist',

                    severity: 'high'            });             */

                });

            }        }



        } catch (error) {    }        const healthReport = {    getLastBackupTime() {

            report.warnings.push({

                type: 'DISK_SPACE_ERROR',

                message: `Cannot check disk space: ${error.message}`,

                severity: 'low'    /**            timestamp: new Date().toISOString(),        const backupDir = './automated_backups';

            });

        }     * فحص صحة النسخ الاحتياطية

    }

     */            status: 'healthy',        

    evaluateOverallHealth(report) {

        const criticalIssues = report.issues.filter(issue => issue.severity === 'critical').length;    async checkBackupHealth(report = null) {

        const highIssues = report.issues.filter(issue => issue.severity === 'high').length;

        const mediumIssues = report.issues.filter(issue => issue.severity === 'medium').length;        const isStandaloneCheck = !report;            issues: [],        if (!fs.existsSync(backupDir)) {



        if (criticalIssues > 0) {        if (isStandaloneCheck) {

            report.status = 'critical';

        } else if (highIssues > 0) {            report = { issues: [], warnings: [], recommendations: [] };            warnings: [],            return 0;

            report.status = 'warning';

        } else if (mediumIssues > 2) {        }

            report.status = 'caution';

        } else {            recommendations: []        }

            report.status = 'healthy';

        }        try {



        report.summary = {            const backupDir = './automated_backups';        };

            total_issues: report.issues.length,

            critical: criticalIssues,            

            high: highIssues,

            medium: mediumIssues,            if (!fs.existsSync(backupDir)) {        const backups = fs.readdirSync(backupDir)

            warnings: report.warnings.length,

            recommendations: report.recommendations.length                report.issues.push({

        };

    }                    type: 'NO_BACKUP_DIRECTORY',        try {            .map(name => {



    async processHealthReport(report) {                    message: 'مجلد النسخ الاحتياطية غير موجود',

        // Save report

        const reportPath = `./health_reports/health_report_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;                    severity: 'high'            // 1. فحص قاعدة البيانات                const backupPath = path.join(backupDir, name);

        

        // Create reports directory if not exists                });

        if (!fs.existsSync('./health_reports')) {

            fs.mkdirSync('./health_reports', { recursive: true });                return;            await this.checkDatabaseHealth(healthReport);                return {

        }

                    }

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

                                name: name,

        // Print health summary

        this.printHealthSummary(report);            const backups = fs.readdirSync(backupDir)



        // Send alerts for critical issues                .filter(name => fs.statSync(path.join(backupDir, name)).isDirectory())            // 2. فحص النسخ الاحتياطية                    created: fs.statSync(backupPath).birthtime

        if (report.status === 'critical' || report.status === 'warning') {

            this.sendHealthAlert(report);                .map(name => ({

        }

                    name,            await this.checkBackupHealth(healthReport);                };

        // Log event

        this.logEvent('HEALTH_CHECK_COMPLETED', `Status: ${report.status}`, report.summary);                    path: path.join(backupDir, name),

    }

                    created: fs.statSync(path.join(backupDir, name)).birthtime                        })

    printHealthSummary(report) {

        const statusEmoji = {                }))

            'healthy': '✅',

            'caution': '⚠️',                .sort((a, b) => b.created - a.created);            // 3. فحص سلامة البيانات            .sort((a, b) => b.created - a.created);

            'warning': '🚨',

            'critical': '🆘'

        };

            if (backups.length === 0) {            await this.checkDataIntegrity(healthReport);

        console.log(`\n${statusEmoji[report.status]} System Status: ${report.status.toUpperCase()}`);

        console.log('═'.repeat(50));                report.issues.push({

        

        if (report.summary) {                    type: 'NO_BACKUPS',                    return backups.length > 0 ? backups[0].created.getTime() : 0;

            console.log(`📊 Summary:`);

            console.log(`   • Critical issues: ${report.summary.critical}`);                    message: 'لا توجد نسخ احتياطية!',

            console.log(`   • High issues: ${report.summary.high}`);

            console.log(`   • Medium issues: ${report.summary.medium}`);                    severity: 'critical'            // 4. فحص مساحة القرص    }

            console.log(`   • Warnings: ${report.summary.warnings}`);

            console.log(`   • Recommendations: ${report.summary.recommendations}`);                });

        }

                return;            await this.checkDiskSpace(healthReport);

        if (report.issues.length > 0) {

            console.log(`\n🚨 Issues Found:`);            }

            report.issues.forEach((issue, index) => {

                console.log(`   ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);                /**

            });

        }            const latestBackup = backups[0];



        if (report.warnings.length > 0) {            const timeSinceLastBackup = Date.now() - latestBackup.created.getTime();            // 5. تقييم الحالة العامة     * فحص سلامة قاعدة البيانات

            console.log(`\n⚠️ Warnings:`);

            report.warnings.forEach((warning, index) => {

                console.log(`   ${index + 1}. ${warning.message}`);

            });            // تحقق من عمر آخر نسخة احتياطية            this.evaluateOverallHealth(healthReport);     */

        }

            if (timeSinceLastBackup > this.alertThresholds.maxTimeSinceBackup) {

        console.log('═'.repeat(50));

    }                report.issues.push({                async checkDatabaseIntegrity() {



    sendHealthAlert(report) {                    type: 'OLD_BACKUP',

        const alertMessage = `🚨 SECURITY ALERT - Classroom Management System

                            message: `آخر نسخة احتياطية قديمة: ${Math.round(timeSinceLastBackup / 1000 / 60 / 60)} ساعة`,            // 6. حفظ التقرير وإرسال التنبيهات        const dbPath = './classroom.db';

Time: ${new Date().toLocaleString()}

Status: ${report.status.toUpperCase()}                    severity: 'medium'

Issues: ${report.issues.length}

                });            await this.processHealthReport(healthReport);        

Critical Issues:

${report.issues.filter(i => i.severity === 'critical' || i.severity === 'high')            }

  .map(i => `• ${i.message}`).join('\n')}

        if (!fs.existsSync(dbPath)) {

Please take immediate action.`;

            // فحص سلامة آخر نسخة احتياطية

        console.log(alertMessage);

                    const reportPath = path.join(latestBackup.path, 'backup_report.json');        } catch (error) {            this.sendAlert('DATABASE_MISSING', { path: dbPath });

        // Future: add email or SMS sending here

        this.logEvent('HEALTH_ALERT_SENT', 'Health alert sent', {            if (fs.existsSync(reportPath)) {

            status: report.status,

            issuesCount: report.issues.length                try {            console.error('❌ خطأ في الفحص الصحي:', error);            return;

        });

    }                    const backupReport = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));



    logEvent(type, message, data = {}) {                    if (backupReport.status !== 'completed') {            this.logEvent('HEALTH_CHECK_ERROR', `خطأ في الفحص: ${error.message}`);        }

        const logEntry = {

            timestamp: new Date().toISOString(),                        report.issues.push({

            type: type,

            message: message,                            type: 'INCOMPLETE_BACKUP',        }

            data: data,

            pid: process.pid                            message: 'آخر نسخة احتياطية غير مكتملة',

        };

                            severity: 'medium'    }        const stats = fs.statSync(dbPath);

        try {

            fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');                        });

        } catch (error) {

            console.error('Log write error:', error.message);                    }        

        }

    }                } catch (error) {



    showMonitoringStats() {                    report.warnings.push({    /**        // فحص حجم قاعدة البيانات

        console.log('\n📊 Monitoring Service Statistics');

        console.log('═'.repeat(40));                        type: 'BACKUP_REPORT_ERROR',

        

        if (fs.existsSync(this.logFile)) {                        message: `خطأ في قراءة تقرير النسخة الاحتياطية: ${error.message}`,     * فحص صحة قاعدة البيانات        if (stats.size < 1024) { // أقل من 1KB مشكوك به

            try {

                const logs = fs.readFileSync(this.logFile, 'utf-8')                        severity: 'low'

                    .split('\n')

                    .filter(line => line.trim())                    });     */            this.sendAlert('DATABASE_TOO_SMALL', { size: stats.size });

                    .map(line => JSON.parse(line));

                }

                const today = new Date().toISOString().split('T')[0];

                const todayLogs = logs.filter(log => log.timestamp.startsWith(today));            }    async checkDatabaseHealth(report) {        }



                console.log(`📅 Today's events: ${todayLogs.length}`);

                console.log(`📝 Total events: ${logs.length}`);

                            console.log(`✅ فحص النسخ الاحتياطية: ${backups.length} نسخة متوفرة`);        try {

                const eventTypes = {};

                todayLogs.forEach(log => {

                    eventTypes[log.type] = (eventTypes[log.type] || 0) + 1;

                });            if (isStandaloneCheck && report.issues.length > 0) {            // التحقق من وجود ملف قاعدة البيانات        // فحص آخر تعديل



                console.log('🔍 Today\'s event types:');                console.log('⚠️ مشاكل في النسخ الاحتياطية:', report.issues);

                Object.entries(eventTypes).forEach(([type, count]) => {

                    console.log(`   ${type}: ${count}`);            }            if (!fs.existsSync('./classroom.db')) {        const lastModified = stats.mtime.getTime();

                });

            } catch (error) {

                console.error('Error reading logs:', error.message);

            }        } catch (error) {                report.issues.push({        const timeSinceModified = Date.now() - lastModified;

        } else {

            console.log('📝 No logs yet');            report.issues.push({

        }

    }                type: 'BACKUP_CHECK_ERROR',                    type: 'CRITICAL',        

}

                message: `خطأ في فحص النسخ الاحتياطية: ${error.message}`,

// Run service

if (require.main === module) {                severity: 'medium'                    message: 'ملف قاعدة البيانات الرئيسي مفقود!',        // إذا لم تتغير قاعدة البيانات لأكثر من 24 ساعة

    const monitoringService = new BackupMonitoringService();

                });

    const command = process.argv[2];

            }                    severity: 'critical'        if (timeSinceModified > 24 * 60 * 60 * 1000) {

    switch(command) {

        case 'start':    }

            console.log('🔄 Starting continuous monitoring service...');

            console.log('Press Ctrl+C to stop');                });            this.sendAlert('DATABASE_NOT_UPDATED', {

            // Keep process running

            process.on('SIGINT', () => {    /**

                console.log('\n🛑 Stopping monitoring service...');

                monitoringService.logEvent('SERVICE_STOPPED', 'Monitoring service stopped');     * فحص سلامة البيانات                return;                lastModified: stats.mtime.toLocaleString('ar-SA'),

                process.exit(0);

            });     */

            break;

                async checkDataIntegrity(report = null) {            }                hoursSinceUpdate: Math.round(timeSinceModified / (60 * 60 * 1000))

        case 'check':

            monitoringService.performHealthCheck().then(() => {        const isStandaloneCheck = !report;

                console.log('✅ Health check completed');

                process.exit(0);        if (isStandaloneCheck) {            });

            });

            break;            report = { issues: [], warnings: [], recommendations: [] };

            

        case 'backup-check':        }            // فحص إحصائيات قاعدة البيانات إذا كانت النماذج متوفرة        }

            monitoringService.checkBackupHealth();

            process.exit(0);

            break;

                    try {            if (Student && Attendance && Section) {

        case 'data-check':

            monitoringService.checkDataIntegrity();            // فحص سلامة البيانات إذا كانت النماذج متوفرة

            process.exit(0);

            break;            if (Section && Student && Attendance) {                const totalStudents = await Student.count();        console.log(`✅ قاعدة البيانات سليمة - الحجم: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

            

        case 'stats':                // فحص الأقسام الفارغة من السجلات

            monitoringService.showMonitoringStats();

            process.exit(0);                const sections = await Section.findAll({                const totalAttendance = await Attendance.count();    }

            break;

                                include: [{

        default:

            console.log('\n🔍 Advanced Monitoring Service');                        model: Student,                const totalSections = await Section.count();

            console.log('Usage:');

            console.log('  node backup_monitoring_service.cjs start        - Start continuous service');                        include: [{

            console.log('  node backup_monitoring_service.cjs check        - Immediate health check');

            console.log('  node backup_monitoring_service.cjs backup-check - Check backups only');                            model: Attendance,    /**

            console.log('  node backup_monitoring_service.cjs data-check   - Check data integrity');

            console.log('  node backup_monitoring_service.cjs stats        - Show statistics');                            required: false

            process.exit(0);

    }                        }]                console.log(`📊 الإحصائيات: ${totalStudents} طالب، ${totalAttendance} سجل حضور، ${totalSections} قسم`);     * فحص مساحة القرص

}

                    }]

module.exports = BackupMonitoringService;
                });     */



                let sectionsWithoutRecords = 0;                report.databaseStats = {    checkDiskSpace() {

                sections.forEach(section => {

                    const studentsWithoutRecords = section.Students.filter(student =>                     totalStudents,        try {

                        student.Attendances.length === 0

                    ).length;                    totalAttendance,            const { execSync } = require('child_process');



                    if (studentsWithoutRecords > 0) {                    totalSections            

                        sectionsWithoutRecords++;

                        if (studentsWithoutRecords === section.Students.length) {                };            // للنظم Windows

                            report.warnings.push({

                                type: 'SECTION_NO_RECORDS',            } else {            const result = execSync('dir /-c', { cwd: process.cwd(), encoding: 'utf8' });

                                message: `القسم ${section.name} لا يحتوي على أي سجلات حضور`,

                                severity: 'medium'                report.warnings.push({            console.log('💾 مساحة القرص متاحة');

                            });

                        }                    type: 'DATABASE_CONNECTION',            

                    }

                });                    message: 'لا يمكن الاتصال بقاعدة البيانات لفحص الإحصائيات',        } catch (error) {



                console.log(`🔍 فحص سلامة البيانات: ${sectionsWithoutRecords} قسم يحتاج مراجعة`);                    severity: 'medium'            console.log('⚠️ لا يمكن فحص مساحة القرص:', error.message);

            } else {

                report.warnings.push({                });        }

                    type: 'DATA_INTEGRITY_SKIP',

                    message: 'تم تخطي فحص سلامة البيانات - لا يمكن الاتصال بقاعدة البيانات',            }    }

                    severity: 'low'

                });

            }

        } catch (error) {    /**

        } catch (error) {

            report.issues.push({            report.issues.push({     * التحقق من النسخ الاحتياطية المتاحة

                type: 'DATA_INTEGRITY_ERROR',

                message: `خطأ في فحص سلامة البيانات: ${error.message}`,                type: 'DATABASE_ERROR',     */

                severity: 'medium'

            });                message: `خطأ في الاتصال بقاعدة البيانات: ${error.message}`,    validateAvailableBackups() {

        }

    }                severity: 'high'        const backupDirs = ['./automated_backups', './security_backups'];



    /**            });        let totalBackups = 0;

     * فحص مساحة القرص

     */        }        

    async checkDiskSpace(report) {

        try {    }        backupDirs.forEach(dir => {

            if (fs.existsSync('./classroom.db')) {

                const stats = fs.statSync('./classroom.db');            if (fs.existsSync(dir)) {

                const dbSizeMB = stats.size / 1024 / 1024;

    /**                const backups = fs.readdirSync(dir);

                if (dbSizeMB > 100) { // إذا تجاوزت قاعدة البيانات 100 ميجا

                    report.recommendations.push({     * فحص صحة النسخ الاحتياطية                totalBackups += backups.length;

                        type: 'LARGE_DATABASE',

                        message: `حجم قاعدة البيانات كبير: ${dbSizeMB.toFixed(2)} MB`,     */                console.log(`📦 ${dir}: ${backups.length} نسخة احتياطية`);

                        severity: 'low'

                    });    async checkBackupHealth(report = null) {            }

                }

        const isStandaloneCheck = !report;        });

                console.log(`💾 حجم قاعدة البيانات: ${dbSizeMB.toFixed(2)} MB`);

            } else {        if (isStandaloneCheck) {

                report.warnings.push({

                    type: 'NO_DATABASE_FILE',            report = { issues: [], warnings: [], recommendations: [] };        if (totalBackups === 0) {

                    message: 'ملف قاعدة البيانات غير موجود',

                    severity: 'high'        }            this.sendAlert('NO_BACKUPS_AVAILABLE', {});

                });

            }        } else if (totalBackups < 3) {



        } catch (error) {        try {            this.sendAlert('LOW_BACKUP_COUNT', { count: totalBackups });

            report.warnings.push({

                type: 'DISK_SPACE_ERROR',            const backupDir = './automated_backups';        }

                message: `لا يمكن فحص مساحة القرص: ${error.message}`,

                severity: 'low'            

            });

        }            if (!fs.existsSync(backupDir)) {        console.log(`📊 إجمالي النسخ الاحتياطية: ${totalBackups}`);

    }

                report.issues.push({    }

    /**

     * تقييم الحالة العامة                    type: 'NO_BACKUP_DIRECTORY',

     */

    evaluateOverallHealth(report) {                    message: 'مجلد النسخ الاحتياطية غير موجود',    /**

        const criticalIssues = report.issues.filter(issue => issue.severity === 'critical').length;

        const highIssues = report.issues.filter(issue => issue.severity === 'high').length;                    severity: 'high'     * إرسال تنبيه

        const mediumIssues = report.issues.filter(issue => issue.severity === 'medium').length;

                });     */

        if (criticalIssues > 0) {

            report.status = 'critical';                return;    sendAlert(type, data) {

        } else if (highIssues > 0) {

            report.status = 'warning';            }        const alert = {

        } else if (mediumIssues > 2) {

            report.status = 'caution';            timestamp: new Date().toISOString(),

        } else {

            report.status = 'healthy';            const backups = fs.readdirSync(backupDir)            type: type,

        }

                .filter(name => fs.statSync(path.join(backupDir, name)).isDirectory())            severity: this.getAlertSeverity(type),

        report.summary = {

            total_issues: report.issues.length,                .map(name => ({            data: data,

            critical: criticalIssues,

            high: highIssues,                    name,            message: this.getAlertMessage(type, data)

            medium: mediumIssues,

            warnings: report.warnings.length,                    path: path.join(backupDir, name),        };

            recommendations: report.recommendations.length

        };                    created: fs.statSync(path.join(backupDir, name)).birthtime

    }

                }))        // طباعة التنبيه في وحدة التحكم

    /**

     * معالجة تقرير الصحة وإرسال التنبيهات                .sort((a, b) => b.created - a.created);        const severityEmoji = {

     */

    async processHealthReport(report) {            'low': '💡',

        // حفظ التقرير

        const reportPath = `./health_reports/health_report_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;            if (backups.length === 0) {            'medium': '⚠️',

        

        // إنشاء مجلد التقارير إذا لم يكن موجوداً                report.issues.push({            'high': '🚨',

        if (!fs.existsSync('./health_reports')) {

            fs.mkdirSync('./health_reports', { recursive: true });                    type: 'NO_BACKUPS',            'critical': '💀'

        }

                            message: 'لا توجد نسخ احتياطية!',        };

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

                    severity: 'critical'

        // طباعة ملخص الحالة

        this.printHealthSummary(report);                });        console.log(`\n${severityEmoji[alert.severity]} تنبيه ${alert.severity.toUpperCase()}: ${alert.message}`);



        // إرسال تنبيهات للمشاكل الحرجة                return;        console.log(`📅 الوقت: ${new Date(alert.timestamp).toLocaleString('ar-SA')}`);

        if (report.status === 'critical' || report.status === 'warning') {

            this.sendHealthAlert(report);            }        if (Object.keys(data).length > 0) {

        }

            console.log(`📊 البيانات:`, data);

        // تسجيل الحدث

        this.logEvent('HEALTH_CHECK_COMPLETED', `الحالة: ${report.status}`, report.summary);            const latestBackup = backups[0];        }

    }

            const timeSinceLastBackup = Date.now() - latestBackup.created.getTime();

    /**

     * طباعة ملخص الصحة        // حفظ التنبيه في ملف السجل

     */

    printHealthSummary(report) {            // تحقق من عمر آخر نسخة احتياطية        const logEntry = `ALERT: ${JSON.stringify(alert)}\n`;

        const statusEmoji = {

            'healthy': '✅',            if (timeSinceLastBackup > this.alertThresholds.maxTimeSinceBackup) {        fs.appendFileSync('./backup_alerts.log', logEntry);

            'caution': '⚠️',

            'warning': '🚨',                report.issues.push({

            'critical': '🆘'

        };                    type: 'OLD_BACKUP',        // إرسال تنبيه نظام (Windows)



        console.log(`\n${statusEmoji[report.status]} حالة النظام: ${report.status.toUpperCase()}`);                    message: `آخر نسخة احتياطية قديمة: ${Math.round(timeSinceLastBackup / 1000 / 60 / 60)} ساعة`,        if (alert.severity === 'high' || alert.severity === 'critical') {

        console.log('═'.repeat(50));

                            severity: 'medium'            this.sendSystemNotification(alert.message);

        if (report.summary) {

            console.log(`📊 الملخص:`);                });        }

            console.log(`   • مشاكل حرجة: ${report.summary.critical}`);

            console.log(`   • مشاكل عالية: ${report.summary.high}`);            }    }

            console.log(`   • مشاكل متوسطة: ${report.summary.medium}`);

            console.log(`   • تحذيرات: ${report.summary.warnings}`);

            console.log(`   • توصيات: ${report.summary.recommendations}`);

        }            // فحص سلامة آخر نسخة احتياطية    /**



        if (report.issues.length > 0) {            const reportPath = path.join(latestBackup.path, 'backup_report.json');     * تحديد شدة التنبيه

            console.log(`\n🚨 المشاكل المكتشفة:`);

            report.issues.forEach((issue, index) => {            if (fs.existsSync(reportPath)) {     */

                console.log(`   ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);

            });                try {    getAlertSeverity(type) {

        }

                    const backupReport = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));        const severityMap = {

        if (report.warnings.length > 0) {

            console.log(`\n⚠️ التحذيرات:`);                    if (backupReport.status !== 'completed') {            'BACKUP_OVERDUE': 'high',

            report.warnings.forEach((warning, index) => {

                console.log(`   ${index + 1}. ${warning.message}`);                        report.issues.push({            'DATABASE_MISSING': 'critical',

            });

        }                            type: 'INCOMPLETE_BACKUP',            'DATABASE_TOO_SMALL': 'high',



        console.log('═'.repeat(50));                            message: 'آخر نسخة احتياطية غير مكتملة',            'DATABASE_NOT_UPDATED': 'medium',

    }

                            severity: 'medium'            'NO_BACKUPS_AVAILABLE': 'critical',

    /**

     * إرسال تنبيه صحي                        });            'LOW_BACKUP_COUNT': 'medium',

     */

    sendHealthAlert(report) {                    }            'MONITOR_ERROR': 'medium'

        const alertMessage = `🚨 تنبيه أمني - نظام إدارة الفصول الدراسية

                        } catch (error) {        };

الوقت: ${new Date().toLocaleString('ar-SA')}

الحالة: ${report.status.toUpperCase()}                    report.warnings.push({

المشاكل: ${report.issues.length}

                        type: 'BACKUP_REPORT_ERROR',        return severityMap[type] || 'low';

المشاكل الحرجة:

${report.issues.filter(i => i.severity === 'critical' || i.severity === 'high')                        message: `خطأ في قراءة تقرير النسخة الاحتياطية: ${error.message}`,    }

  .map(i => `• ${i.message}`).join('\n')}

                        severity: 'low'

يرجى اتخاذ الإجراءات اللازمة فوراً.`;

                    });    /**

        console.log(alertMessage);

                        }     * الحصول على رسالة التنبيه

        // هنا يمكن إضافة إرسال إيميل أو SMS في المستقبل

        this.logEvent('HEALTH_ALERT_SENT', 'تم إرسال تنبيه صحي', {            }     */

            status: report.status,

            issuesCount: report.issues.length    getAlertMessage(type, data) {

        });

    }            console.log(`✅ فحص النسخ الاحتياطية: ${backups.length} نسخة متوفرة`);        const messages = {



    /**            'BACKUP_OVERDUE': `النسخ الاحتياطي متأخر! آخر نسخة: ${data.lastBackup} (${data.hoursOverdue} ساعة مضت)`,

     * تسجيل الأحداث

     */            if (isStandaloneCheck && report.issues.length > 0) {            'DATABASE_MISSING': `قاعدة البيانات مفقودة: ${data.path}`,

    logEvent(type, message, data = {}) {

        const logEntry = {                console.log('⚠️ مشاكل في النسخ الاحتياطية:', report.issues);            'DATABASE_TOO_SMALL': `قاعدة البيانات صغيرة جداً: ${data.size} بايت`,

            timestamp: new Date().toISOString(),

            type: type,            }            'DATABASE_NOT_UPDATED': `قاعدة البيانات لم تُحدّث منذ ${data.hoursSinceUpdate} ساعة`,

            message: message,

            data: data,            'NO_BACKUPS_AVAILABLE': 'لا توجد نسخ احتياطية متاحة!',

            pid: process.pid

        };        } catch (error) {            'LOW_BACKUP_COUNT': `عدد النسخ الاحتياطية قليل: ${data.count} فقط`,



        try {            report.issues.push({            'MONITOR_ERROR': `خطأ في خدمة المراقبة: ${data.error}`

            fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');

        } catch (error) {                type: 'BACKUP_CHECK_ERROR',        };

            console.error('خطأ في كتابة السجل:', error.message);

        }                message: `خطأ في فحص النسخ الاحتياطية: ${error.message}`,

    }

                severity: 'medium'        return messages[type] || `تنبيه غير محدد: ${type}`;

    /**

     * عرض إحصائيات المراقبة            });    }

     */

    showMonitoringStats() {        }

        console.log('\n📊 إحصائيات خدمة المراقبة');

        console.log('═'.repeat(40));    }    /**

        

        if (fs.existsSync(this.logFile)) {     * إرسال إشعار نظام

            try {

                const logs = fs.readFileSync(this.logFile, 'utf-8')    /**     */

                    .split('\n')

                    .filter(line => line.trim())     * فحص سلامة البيانات    sendSystemNotification(message) {

                    .map(line => JSON.parse(line));

     */        try {

                const today = new Date().toISOString().split('T')[0];

                const todayLogs = logs.filter(log => log.timestamp.startsWith(today));    async checkDataIntegrity(report = null) {            const { execSync } = require('child_process');



                console.log(`📅 أحداث اليوم: ${todayLogs.length}`);        const isStandaloneCheck = !report;            

                console.log(`📝 إجمالي الأحداث: ${logs.length}`);

                        if (isStandaloneCheck) {            // Windows Toast Notification

                const eventTypes = {};

                todayLogs.forEach(log => {            report = { issues: [], warnings: [], recommendations: [] };            const psCommand = `

                    eventTypes[log.type] = (eventTypes[log.type] || 0) + 1;

                });        }                Add-Type -AssemblyName System.Windows.Forms;



                console.log('🔍 أنواع الأحداث اليوم:');                $notify = New-Object System.Windows.Forms.NotifyIcon;

                Object.entries(eventTypes).forEach(([type, count]) => {

                    console.log(`   ${type}: ${count}`);        try {                $notify.Icon = [System.Drawing.SystemIcons]::Warning;

                });

            } catch (error) {            // فحص سلامة البيانات إذا كانت النماذج متوفرة                $notify.Visible = $true;

                console.error('خطأ في قراءة السجلات:', error.message);

            }            if (Section && Student && Attendance) {                $notify.ShowBalloonTip(5000, "تنبيه النسخ الاحتياطي", "${message}", "Warning");

        } else {

            console.log('📝 لا توجد سجلات بعد');                // فحص الأقسام الفارغة من السجلات            `;

        }

    }                const sections = await Section.findAll({            

}

                    include: [{            execSync(`powershell -Command "${psCommand}"`, { stdio: 'ignore' });

// تشغيل الخدمة

if (require.main === module) {                        model: Student,            

    const monitoringService = new BackupMonitoringService();

                            include: [{        } catch (error) {

    const command = process.argv[2];

                                model: Attendance,            console.log('⚠️ فشل إرسال إشعار النظام:', error.message);

    switch(command) {

        case 'start':                            required: false        }

            console.log('🔄 تشغيل خدمة المراقبة المستمرة...');

            console.log('اضغط Ctrl+C للإيقاف');                        }]    }

            // الحفاظ على تشغيل العملية

            process.on('SIGINT', () => {                    }]

                console.log('\n🛑 إيقاف خدمة المراقبة...');

                monitoringService.logEvent('SERVICE_STOPPED', 'تم إيقاف خدمة المراقبة');                });    /**

                process.exit(0);

            });     * عرض إحصائيات المراقبة

            break;

                            let sectionsWithoutRecords = 0;     */

        case 'check':

            monitoringService.performHealthCheck().then(() => {                sections.forEach(section => {    showMonitoringStats() {

                console.log('✅ تم الفحص الصحي');

                process.exit(0);                    const studentsWithoutRecords = section.Students.filter(student =>         console.log('\n📊 إحصائيات مراقبة النسخ الاحتياطية');

            });

            break;                        student.Attendances.length === 0        console.log('='.repeat(50));

            

        case 'backup-check':                    ).length;        

            monitoringService.checkBackupHealth();

            process.exit(0);        const lastBackup = this.getLastBackupTime();

            break;

                                if (studentsWithoutRecords > 0) {        if (lastBackup > 0) {

        case 'data-check':

            monitoringService.checkDataIntegrity();                        sectionsWithoutRecords++;            const timeSince = Date.now() - lastBackup;

            process.exit(0);

            break;                        if (studentsWithoutRecords === section.Students.length) {            console.log(`⏰ آخر نسخة احتياطية: ${new Date(lastBackup).toLocaleString('ar-SA')}`);

            

        case 'stats':                            report.warnings.push({            console.log(`🕐 مضى عليها: ${Math.round(timeSince / (60 * 60 * 1000))} ساعة`);

            monitoringService.showMonitoringStats();

            process.exit(0);                                type: 'SECTION_NO_RECORDS',        } else {

            break;

                                            message: `القسم ${section.name} لا يحتوي على أي سجلات حضور`,            console.log('❌ لم يتم العثور على نسخ احتياطية');

        default:

            console.log('\n🔍 خدمة المراقبة المتقدمة');                                severity: 'medium'        }

            console.log('الاستخدام:');

            console.log('  node backup_monitoring_service.cjs start        - تشغيل الخدمة المستمرة');                            });

            console.log('  node backup_monitoring_service.cjs check        - فحص صحي فوري');

            console.log('  node backup_monitoring_service.cjs backup-check - فحص النسخ الاحتياطية');                        }        // إحصائيات قاعدة البيانات

            console.log('  node backup_monitoring_service.cjs data-check   - فحص سلامة البيانات');

            console.log('  node backup_monitoring_service.cjs stats        - عرض الإحصائيات');                    }        if (fs.existsSync('./classroom.db')) {

            process.exit(0);

    }                });            const stats = fs.statSync('./classroom.db');

}

            console.log(`💾 حجم قاعدة البيانات: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

module.exports = BackupMonitoringService;
                console.log(`🔍 فحص سلامة البيانات: ${sectionsWithoutRecords} قسم يحتاج مراجعة`);            console.log(`📅 آخر تعديل: ${stats.mtime.toLocaleString('ar-SA')}`);

            } else {        }

                report.warnings.push({

                    type: 'DATA_INTEGRITY_SKIP',        // عدد التنبيهات

                    message: 'تم تخطي فحص سلامة البيانات - لا يمكن الاتصال بقاعدة البيانات',        if (fs.existsSync('./backup_alerts.log')) {

                    severity: 'low'            const alerts = fs.readFileSync('./backup_alerts.log', 'utf-8').split('\n').filter(line => line.trim());

                });            console.log(`🚨 عدد التنبيهات: ${alerts.length}`);

            }        }

    }

        } catch (error) {}

            report.issues.push({

                type: 'DATA_INTEGRITY_ERROR',// تشغيل الخدمة

                message: `خطأ في فحص سلامة البيانات: ${error.message}`,if (require.main === module) {

                severity: 'medium'    const monitor = new BackupMonitoringService();

            });    

        }    const command = process.argv[2];

    }    

    if (command === 'stats') {

    /**        monitor.showMonitoringStats();

     * فحص مساحة القرص    } else if (command === 'check') {

     */        monitor.checkBackupHealth();

    async checkDiskSpace(report) {    } else {

        try {        console.log('\n👁️ خدمة مراقبة النسخ الاحتياطية');

            if (fs.existsSync('./classroom.db')) {        console.log('مراقبة مستمرة للنسخ الاحتياطية وقواعد البيانات...');

                const stats = fs.statSync('./classroom.db');        console.log('اضغط Ctrl+C للإيقاف');

                const dbSizeMB = stats.size / 1024 / 1024;        

        // الحفاظ على تشغيل العملية

                if (dbSizeMB > 100) { // إذا تجاوزت قاعدة البيانات 100 ميجا        process.on('SIGINT', () => {

                    report.recommendations.push({            console.log('\n👋 تم إيقاف خدمة المراقبة');

                        type: 'LARGE_DATABASE',            process.exit(0);

                        message: `حجم قاعدة البيانات كبير: ${dbSizeMB.toFixed(2)} MB`,        });

                        severity: 'low'    }

                    });}

                }

module.exports = BackupMonitoringService;
                console.log(`💾 حجم قاعدة البيانات: ${dbSizeMB.toFixed(2)} MB`);
            } else {
                report.warnings.push({
                    type: 'NO_DATABASE_FILE',
                    message: 'ملف قاعدة البيانات غير موجود',
                    severity: 'high'
                });
            }

        } catch (error) {
            report.warnings.push({
                type: 'DISK_SPACE_ERROR',
                message: `لا يمكن فحص مساحة القرص: ${error.message}`,
                severity: 'low'
            });
        }
    }

    /**
     * تقييم الحالة العامة
     */
    evaluateOverallHealth(report) {
        const criticalIssues = report.issues.filter(issue => issue.severity === 'critical').length;
        const highIssues = report.issues.filter(issue => issue.severity === 'high').length;
        const mediumIssues = report.issues.filter(issue => issue.severity === 'medium').length;

        if (criticalIssues > 0) {
            report.status = 'critical';
        } else if (highIssues > 0) {
            report.status = 'warning';
        } else if (mediumIssues > 2) {
            report.status = 'caution';
        } else {
            report.status = 'healthy';
        }

        report.summary = {
            total_issues: report.issues.length,
            critical: criticalIssues,
            high: highIssues,
            medium: mediumIssues,
            warnings: report.warnings.length,
            recommendations: report.recommendations.length
        };
    }

    /**
     * معالجة تقرير الصحة وإرسال التنبيهات
     */
    async processHealthReport(report) {
        // حفظ التقرير
        const reportPath = `./health_reports/health_report_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        
        // إنشاء مجلد التقارير إذا لم يكن موجوداً
        if (!fs.existsSync('./health_reports')) {
            fs.mkdirSync('./health_reports', { recursive: true });
        }
        
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        // طباعة ملخص الحالة
        this.printHealthSummary(report);

        // إرسال تنبيهات للمشاكل الحرجة
        if (report.status === 'critical' || report.status === 'warning') {
            this.sendHealthAlert(report);
        }

        // تسجيل الحدث
        this.logEvent('HEALTH_CHECK_COMPLETED', `الحالة: ${report.status}`, report.summary);
    }

    /**
     * طباعة ملخص الصحة
     */
    printHealthSummary(report) {
        const statusEmoji = {
            'healthy': '✅',
            'caution': '⚠️',
            'warning': '🚨',
            'critical': '🆘'
        };

        console.log(`\n${statusEmoji[report.status]} حالة النظام: ${report.status.toUpperCase()}`);
        console.log('═'.repeat(50));
        
        if (report.summary) {
            console.log(`📊 الملخص:`);
            console.log(`   • مشاكل حرجة: ${report.summary.critical}`);
            console.log(`   • مشاكل عالية: ${report.summary.high}`);
            console.log(`   • مشاكل متوسطة: ${report.summary.medium}`);
            console.log(`   • تحذيرات: ${report.summary.warnings}`);
            console.log(`   • توصيات: ${report.summary.recommendations}`);
        }

        if (report.issues.length > 0) {
            console.log(`\n🚨 المشاكل المكتشفة:`);
            report.issues.forEach((issue, index) => {
                console.log(`   ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
            });
        }

        if (report.warnings.length > 0) {
            console.log(`\n⚠️ التحذيرات:`);
            report.warnings.forEach((warning, index) => {
                console.log(`   ${index + 1}. ${warning.message}`);
            });
        }

        console.log('═'.repeat(50));
    }

    /**
     * إرسال تنبيه صحي
     */
    sendHealthAlert(report) {
        const alertMessage = `🚨 تنبيه أمني - نظام إدارة الفصول الدراسية
        
الوقت: ${new Date().toLocaleString('ar-SA')}
الحالة: ${report.status.toUpperCase()}
المشاكل: ${report.issues.length}

المشاكل الحرجة:
${report.issues.filter(i => i.severity === 'critical' || i.severity === 'high')
  .map(i => `• ${i.message}`).join('\n')}

يرجى اتخاذ الإجراءات اللازمة فوراً.`;

        console.log(alertMessage);
        
        // هنا يمكن إضافة إرسال إيميل أو SMS في المستقبل
        this.logEvent('HEALTH_ALERT_SENT', 'تم إرسال تنبيه صحي', {
            status: report.status,
            issuesCount: report.issues.length
        });
    }

    /**
     * تسجيل الأحداث
     */
    logEvent(type, message, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: type,
            message: message,
            data: data,
            pid: process.pid
        };

        try {
            fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
        } catch (error) {
            console.error('خطأ في كتابة السجل:', error.message);
        }
    }

    /**
     * عرض إحصائيات المراقبة
     */
    showMonitoringStats() {
        console.log('\n📊 إحصائيات خدمة المراقبة');
        console.log('═'.repeat(40));
        
        if (fs.existsSync(this.logFile)) {
            try {
                const logs = fs.readFileSync(this.logFile, 'utf-8')
                    .split('\n')
                    .filter(line => line.trim())
                    .map(line => JSON.parse(line));

                const today = new Date().toISOString().split('T')[0];
                const todayLogs = logs.filter(log => log.timestamp.startsWith(today));

                console.log(`📅 أحداث اليوم: ${todayLogs.length}`);
                console.log(`📝 إجمالي الأحداث: ${logs.length}`);
                
                const eventTypes = {};
                todayLogs.forEach(log => {
                    eventTypes[log.type] = (eventTypes[log.type] || 0) + 1;
                });

                console.log('🔍 أنواع الأحداث اليوم:');
                Object.entries(eventTypes).forEach(([type, count]) => {
                    console.log(`   ${type}: ${count}`);
                });
            } catch (error) {
                console.error('خطأ في قراءة السجلات:', error.message);
            }
        } else {
            console.log('📝 لا توجد سجلات بعد');
        }
    }
}

// تشغيل الخدمة
if (require.main === module) {
    const monitoringService = new BackupMonitoringService();
    
    const command = process.argv[2];
    
    switch(command) {
        case 'start':
            console.log('🔄 تشغيل خدمة المراقبة المستمرة...');
            console.log('اضغط Ctrl+C للإيقاف');
            // الحفاظ على تشغيل العملية
            process.on('SIGINT', () => {
                console.log('\n🛑 إيقاف خدمة المراقبة...');
                monitoringService.logEvent('SERVICE_STOPPED', 'تم إيقاف خدمة المراقبة');
                process.exit(0);
            });
            break;
            
        case 'check':
            monitoringService.performHealthCheck().then(() => {
                console.log('✅ تم الفحص الصحي');
                process.exit(0);
            });
            break;
            
        case 'backup-check':
            monitoringService.checkBackupHealth();
            process.exit(0);
            break;
            
        case 'data-check':
            monitoringService.checkDataIntegrity();
            process.exit(0);
            break;
            
        case 'stats':
            monitoringService.showMonitoringStats();
            process.exit(0);
            break;
            
        default:
            console.log('\n🔍 خدمة المراقبة المتقدمة');
            console.log('الاستخدام:');
            console.log('  node backup_monitoring_service.cjs start        - تشغيل الخدمة المستمرة');
            console.log('  node backup_monitoring_service.cjs check        - فحص صحي فوري');
            console.log('  node backup_monitoring_service.cjs backup-check - فحص النسخ الاحتياطية');
            console.log('  node backup_monitoring_service.cjs data-check   - فحص سلامة البيانات');
            console.log('  node backup_monitoring_service.cjs stats        - عرض الإحصائيات');
            process.exit(0);
    }
}

module.exports = BackupMonitoringService;