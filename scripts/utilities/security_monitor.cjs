#!/usr/bin/env node
/**
 * نظام مراقبة الأمان - Security Monitoring System
 * يراقب تشغيل السكريبتات الخطرة ويرسل إنذارات
 */

const fs = require('fs');
const path = require('path');

class SecurityMonitor {
    constructor() {
        this.dangerousScripts = [
            'reset_db.js',
            'manual_migration.js',
            'repair_student_sections.js',
            'restore_schedule.js',
            'fix_schedule_days.js'
        ];
        
        this.auditLogPath = './security_audit.log';
        this.alertsPath = './security_alerts.log';
        
        this.initializeMonitoring();
    }

    /**
     * تهيئة نظام المراقبة
     */
    initializeMonitoring() {
        // إنشاء ملفات اللوقات إذا لم تكن موجودة
        if (!fs.existsSync(this.auditLogPath)) {
            fs.writeFileSync(this.auditLogPath, '');
        }
        
        if (!fs.existsSync(this.alertsPath)) {
            fs.writeFileSync(this.alertsPath, '');
        }
        
        console.log('🔍 تم تفعيل نظام مراقبة الأمان');
        this.logSecurityEvent({
            type: 'MONITOR_STARTED',
            message: 'تم تفعيل نظام مراقبة الأمان',
            timestamp: new Date().toISOString()
        });
    }

    /**
     * مراقبة تشغيل السكريبتات
     */
    monitorScriptExecution() {
        const currentScript = process.argv[1];
        const scriptName = path.basename(currentScript);
        
        // فحص إذا كان السكريبت خطراً
        if (this.dangerousScripts.includes(scriptName)) {
            this.handleDangerousScript(scriptName);
        }
        
        // تسجيل تشغيل السكريبت
        this.logScriptExecution(scriptName);
    }

    /**
     * معالجة السكريبتات الخطرة
     */
    handleDangerousScript(scriptName) {
        const alert = {
            type: 'DANGEROUS_SCRIPT_EXECUTION',
            script: scriptName,
            user: process.env.USERNAME || 'unknown',
            timestamp: new Date().toISOString(),
            workingDir: process.cwd(),
            processId: process.pid,
            environment: process.env.NODE_ENV || 'unknown'
        };

        // إرسال إنذار فوري
        this.sendAlert(alert);
        
        // تسجيل في لوق الأمان
        this.logSecurityEvent(alert);
        
        // عرض تحذير في وحدة التحكم
        this.displayWarning(alert);
    }

    /**
     * إرسال إنذار أمني
     */
    sendAlert(alert) {
        const alertMessage = {
            ...alert,
            severity: this.calculateSeverity(alert.script),
            recommendations: this.getSecurityRecommendations(alert.script)
        };
        
        // كتابة الإنذار في ملف الإنذارات
        fs.appendFileSync(this.alertsPath, JSON.stringify(alertMessage) + '\n');
        
        // في بيئة حقيقية، يمكن إرسال إنذارات عبر البريد الإلكتروني أو Slack
        console.log('🚨 تم إرسال إنذار أمني!');
    }

    /**
     * حساب شدة الخطر
     */
    calculateSeverity(scriptName) {
        const severityMap = {
            'reset_db.js': 'CRITICAL',
            'manual_migration.js': 'HIGH',
            'repair_student_sections.js': 'HIGH', 
            'restore_schedule.js': 'MEDIUM',
            'fix_schedule_days.js': 'MEDIUM'
        };
        
        return severityMap[scriptName] || 'LOW';
    }

    /**
     * الحصول على توصيات أمنية
     */
    getSecurityRecommendations(scriptName) {
        const recommendations = {
            'reset_db.js': [
                'تأكد من وجود نسخة احتياطية حديثة',
                'احصل على موافقة المشرف',
                'تشغيل في بيئة تطوير فقط',
                'راجع البيانات المحذوفة'
            ],
            'manual_migration.js': [
                'أنشئ نسخة احتياطية قبل الترحيل',
                'اختبر في بيئة تطوير أولاً',
                'راجع التغييرات على هيكل قاعدة البيانات'
            ]
        };
        
        return recommendations[scriptName] || ['راجع العملية مع فريق الأمان'];
    }

    /**
     * عرض تحذير في وحدة التحكم
     */
    displayWarning(alert) {
        console.log('\n' + '🚨'.repeat(20));
        console.log('🔴 تحذير أمني - SECURITY ALERT');
        console.log('🚨'.repeat(20));
        console.log(`📝 السكريبت: ${alert.script}`);
        console.log(`👤 المستخدم: ${alert.user}`);
        console.log(`⏰ الوقت: ${new Date(alert.timestamp).toLocaleString('ar-SA')}`);
        console.log(`🌍 البيئة: ${alert.environment}`);
        console.log(`📁 المجلد: ${alert.workingDir}`);
        console.log(`⚡ معرف العملية: ${alert.processId}`);
        console.log(`⚠️ مستوى الخطر: ${this.calculateSeverity(alert.script)}`);
        console.log('🚨'.repeat(20) + '\n');
    }

    /**
     * تسجيل تشغيل السكريبت
     */
    logScriptExecution(scriptName) {
        const logEntry = {
            type: 'SCRIPT_EXECUTION',
            script: scriptName,
            user: process.env.USERNAME || 'unknown',
            timestamp: new Date().toISOString(),
            workingDir: process.cwd(),
            processId: process.pid
        };
        
        this.logSecurityEvent(logEntry);
    }

    /**
     * تسجيل حدث أمني
     */
    logSecurityEvent(event) {
        const logLine = JSON.stringify({
            ...event,
            timestamp: event.timestamp || new Date().toISOString()
        }) + '\n';
        
        fs.appendFileSync(this.auditLogPath, logLine);
    }

    /**
     * تحليل لوقات الأمان
     */
    analyzeSecurityLogs() {
        if (!fs.existsSync(this.auditLogPath)) {
            console.log('📝 لا توجد لوقات أمان للتحليل');
            return;
        }

        const logContent = fs.readFileSync(this.auditLogPath, 'utf-8');
        const logLines = logContent.trim().split('\n').filter(line => line);
        
        if (logLines.length === 0) {
            console.log('📝 ملف اللوقات فارغ');
            return;
        }

        console.log('📊 تحليل لوقات الأمان');
        console.log('='.repeat(40));
        
        const events = logLines.map(line => {
            try {
                return JSON.parse(line);
            } catch {
                return null;
            }
        }).filter(Boolean);

        // إحصائيات عامة
        console.log(`📝 إجمالي الأحداث: ${events.length}`);
        
        // تحليل أنواع الأحداث
        const eventTypes = {};
        const dangerousEvents = [];
        
        events.forEach(event => {
            eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;
            
            if (event.type === 'DANGEROUS_SCRIPT_EXECUTION') {
                dangerousEvents.push(event);
            }
        });

        console.log('\n📈 أنواع الأحداث:');
        Object.entries(eventTypes).forEach(([type, count]) => {
            console.log(`  ${type}: ${count}`);
        });

        // السكريبتات الخطرة
        if (dangerousEvents.length > 0) {
            console.log('\n🚨 السكريبتات الخطرة المشغلة:');
            dangerousEvents.forEach(event => {
                console.log(`  - ${event.script} بواسطة ${event.user} في ${new Date(event.timestamp).toLocaleString('ar-SA')}`);
            });
        }

        // آخر نشاط
        const latestEvent = events[events.length - 1];
        console.log(`\n⏰ آخر نشاط: ${new Date(latestEvent.timestamp).toLocaleString('ar-SA')}`);
    }

    /**
     * إنشاء تقرير أمان
     */
    generateSecurityReport() {
        const reportPath = `security_report_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        
        this.analyzeSecurityLogs();
        
        const report = {
            generatedAt: new Date().toISOString(),
            monitoringActive: true,
            dangerousScripts: this.dangerousScripts,
            auditLogPath: this.auditLogPath,
            alertsPath: this.alertsPath
        };

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📋 تم إنشاء تقرير الأمان: ${reportPath}`);
    }

    /**
     * مراقبة مستمرة للنظام
     */
    startContinuousMonitoring() {
        console.log('🔄 بدء المراقبة المستمرة...');
        
        // مراقبة كل 30 ثانية
        setInterval(() => {
            this.checkSystemHealth();
        }, 30000);

        console.log('✅ المراقبة المستمرة فعالة (كل 30 ثانية)');
    }

    /**
     * فحص حالة النظام
     */
    checkSystemHealth() {
        // فحص ملفات قاعدة البيانات
        const dbFiles = ['classroom.db', 'classroom_dev.db', 'classroom_test.db'];
        
        dbFiles.forEach(dbFile => {
            if (fs.existsSync(dbFile)) {
                const stats = fs.statSync(dbFile);
                
                // فحص إذا تم تعديل قاعدة البيانات مؤخراً
                const lastModified = stats.mtime.getTime();
                const now = Date.now();
                const timeDiff = now - lastModified;
                
                // إذا تم تعديلها خلال آخر دقيقة
                if (timeDiff < 60000) {
                    this.logSecurityEvent({
                        type: 'DATABASE_MODIFIED',
                        database: dbFile,
                        modifiedAt: new Date(lastModified).toISOString(),
                        size: stats.size
                    });
                }
            }
        });
    }
}

// إذا تم تشغيل الملف مباشرة
if (require.main === module) {
    const monitor = new SecurityMonitor();
    
    // عرض القائمة
    console.log('\n🛡️ نظام مراقبة الأمان');
    console.log('1. تحليل لوقات الأمان');
    console.log('2. إنشاء تقرير أمان');
    console.log('3. بدء المراقبة المستمرة');
    console.log('4. فحص تشغيل السكريبت الحالي');
    
    const action = process.argv[2];
    
    switch(action) {
        case 'analyze':
            monitor.analyzeSecurityLogs();
            break;
        case 'report':
            monitor.generateSecurityReport();
            break;
        case 'monitor':
            monitor.startContinuousMonitoring();
            break;
        case 'check':
            monitor.monitorScriptExecution();
            break;
        default:
            console.log('\nاستخدم:');
            console.log('node security_monitor.cjs analyze  - لتحليل اللوقات');
            console.log('node security_monitor.cjs report   - لإنشاء تقرير');
            console.log('node security_monitor.cjs monitor  - للمراقبة المستمرة');
            console.log('node security_monitor.cjs check    - لفحص السكريبت الحالي');
    }
} else {
    // إذا تم استيراد الملف، ابدأ المراقبة تلقائياً
    const monitor = new SecurityMonitor();
    monitor.monitorScriptExecution();
    
    module.exports = SecurityMonitor;
}