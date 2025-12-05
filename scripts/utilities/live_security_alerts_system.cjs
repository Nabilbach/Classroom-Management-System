#!/usr/bin/env node
/**
 * نظام الإشعارات الأمنية المباشر
 * Live Security Alerts System
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class LiveSecurityAlertsSystem {
    constructor() {
        this.alerts = [];
        this.criticalThresholds = {
            oldBackupHours: 48,     // النسخ الاحتياطية الأقدم من 48 ساعة
            vulnerableScripts: 0,   // لا يُسمح بوجود سكريپتات مكشوفة
            diskSpaceWarning: 85,   // تحذير عند امتلاء القرص بنسبة 85%
            memoryUsage: 80         // تحذير عند استخدام الذاكرة بنسبة 80%
        };
        
        this.alertLevels = {
            CRITICAL: { color: '#ef4444', icon: '🚨', priority: 1 },
            HIGH: { color: '#f97316', icon: '⚠️', priority: 2 },
            MEDIUM: { color: '#eab308', icon: '⚡', priority: 3 },
            LOW: { color: '#06b6d4', icon: 'ℹ️', priority: 4 },
            INFO: { color: '#22c55e', icon: '✅', priority: 5 }
        };
    }

    /**
     * فحص شامل للنظام وإنتاج الإشعارات
     */
    async performSecurityScan() {
        console.log('🔍 بدء الفحص الأمني الشامل...');
        
        this.alerts = [];
        
        // فحص النسخ الاحتياطية
        await this.checkBackupStatus();
        
        // فحص السكريپتات الخطرة
        await this.checkDangerousScripts();
        
        // فحص قواعد البيانات
        await this.checkDatabaseHealth();
        
        // فحص موارد النظام
        await this.checkSystemResources();
        
        // فحص ملفات الأمان
        await this.checkSecurityFiles();
        
        // ترتيب الإشعارات حسب الأولوية
        this.alerts.sort((a, b) => 
            this.alertLevels[a.level].priority - this.alertLevels[b.level].priority
        );
        
        console.log(`✅ تم الفحص، تم العثور على ${this.alerts.length} إشعار`);
        return this.alerts;
    }

    /**
     * فحص حالة النسخ الاحتياطية
     */
    async checkBackupStatus() {
        const backupDirs = [
            'security_backups',
            'automated_backups', 
            'emergency_environment_backups'
        ];

        let latestBackup = null;
        let backupCount = 0;

        for (const dir of backupDirs) {
            if (fs.existsSync(dir)) {
                const items = fs.readdirSync(dir);
                for (const item of items) {
                    const itemPath = path.join(dir, item);
                    const stats = fs.statSync(itemPath);
                    
                    if (stats.isDirectory()) {
                        backupCount++;
                        if (!latestBackup || stats.birthtime > latestBackup.date) {
                            latestBackup = {
                                name: item,
                                date: stats.birthtime,
                                path: itemPath
                            };
                        }
                    }
                }
            }
        }

        // فحص آخر نسخة احتياطية
        if (!latestBackup) {
            this.addAlert('CRITICAL', 'لا توجد نسخ احتياطية!', 
                'لم يتم العثور على أي نسخ احتياطية. النظام معرض لخطر فقدان البيانات.');
        } else {
            const hoursOld = (Date.now() - latestBackup.date.getTime()) / (1000 * 60 * 60);
            
            if (hoursOld > this.criticalThresholds.oldBackupHours) {
                this.addAlert('HIGH', 'النسخة الاحتياطية قديمة!',
                    `آخر نسخة احتياطية عمرها ${hoursOld.toFixed(1)} ساعة. يُنصح بإنشاء نسخة جديدة.`);
            } else if (hoursOld > 24) {
                this.addAlert('MEDIUM', 'النسخة الاحتياطية تحتاج تحديث',
                    `آخر نسخة احتياطية عمرها ${hoursOld.toFixed(1)} ساعة.`);
            } else {
                this.addAlert('INFO', 'النسخ الاحتياطية محدثة',
                    `آخر نسخة احتياطية منذ ${hoursOld.toFixed(1)} ساعة.`);
            }
        }

        // فحص عدد النسخ
        if (backupCount < 3) {
            this.addAlert('MEDIUM', 'عدد النسخ الاحتياطية قليل',
                `يوجد ${backupCount} نسخ فقط. يُنصح بالاحتفاظ بـ 5 نسخ على الأقل.`);
        }
    }

    /**
     * فحص السكريپتات الخطرة
     */
    async checkDangerousScripts() {
        const dangerousScripts = [
            { path: 'backend/reset_db.js', name: 'reset_db.js', criticality: 'CRITICAL' },
            { path: 'backend/manual_migration.js', name: 'manual_migration.js', criticality: 'HIGH' },
            { path: 'backend/repair_student_sections.js', name: 'repair_student_sections.js', criticality: 'HIGH' }
        ];

        for (const script of dangerousScripts) {
            if (fs.existsSync(script.path)) {
                const content = fs.readFileSync(script.path, 'utf-8');
                
                // فحص مستوى الحماية
                const protectionLevel = this.analyzeScriptProtection(content);
                
                if (script.criticality === 'CRITICAL' && protectionLevel < 5) {
                    this.addAlert('CRITICAL', `سكريپت خطر غير محمي: ${script.name}`,
                        `السكريپت ${script.name} خطر جداً ولكن مستوى حمايته منخفض (${protectionLevel}/10).`);
                } else if (protectionLevel < 3) {
                    this.addAlert('HIGH', `سكريپت يحتاج حماية: ${script.name}`,
                        `السكريپت ${script.name} يحتاج تعزيز الحماية (${protectionLevel}/10).`);
                } else if (protectionLevel >= 7) {
                    this.addAlert('INFO', `سكريپت محمي جيداً: ${script.name}`,
                        `السكريپت ${script.name} محمي بمستوى جيد (${protectionLevel}/10).`);
                }
            }
        }
    }

    /**
     * فحص صحة قواعد البيانات
     */
    async checkDatabaseHealth() {
        const databases = [
            'classroom.db',
            'classroom_dev.db', 
            'classroom_test.db'
        ];

        for (const db of databases) {
            if (fs.existsSync(db)) {
                const stats = fs.statSync(db);
                const sizeInMB = stats.size / (1024 * 1024);
                
                if (sizeInMB > 100) {
                    this.addAlert('MEDIUM', `قاعدة بيانات كبيرة: ${db}`,
                        `حجم قاعدة البيانات ${sizeInMB.toFixed(2)} MB. قد تحتاج تحسين.`);
                } else if (sizeInMB < 0.1) {
                    this.addAlert('HIGH', `قاعدة بيانات فارغة: ${db}`,
                        `قاعدة البيانات ${db} صغيرة جداً (${sizeInMB.toFixed(2)} MB). قد تكون تالفة.`);
                }

                // فحص آخر تعديل
                const hoursOld = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
                if (hoursOld > 168) { // أسبوع
                    this.addAlert('LOW', `قاعدة بيانات غير نشطة: ${db}`,
                        `لم يتم تحديث ${db} منذ ${Math.floor(hoursOld / 24)} يوم.`);
                }
            } else {
                this.addAlert('CRITICAL', `قاعدة بيانات مفقودة: ${db}`,
                    `قاعدة البيانات ${db} غير موجودة!`);
            }
        }
    }

    /**
     * فحص موارد النظام
     */
    async checkSystemResources() {
        try {
            // فحص الذاكرة
            const memUsage = process.memoryUsage();
            const memUsedMB = memUsage.rss / (1024 * 1024);
            
            if (memUsedMB > 100) {
                this.addAlert('MEDIUM', 'استخدام ذاكرة مرتفع',
                    `النظام يستخدم ${memUsedMB.toFixed(1)} MB من الذاكرة.`);
            }

            // فحص وقت التشغيل
            const uptimeHours = process.uptime() / 3600;
            if (uptimeHours > 24) {
                this.addAlert('LOW', 'النظام يعمل لفترة طويلة',
                    `النظام يعمل منذ ${uptimeHours.toFixed(1)} ساعة. قد يحتاج إعادة تشغيل.`);
            }

        } catch (error) {
            this.addAlert('MEDIUM', 'خطأ في فحص موارد النظام',
                `فشل في فحص موارد النظام: ${error.message}`);
        }
    }

    /**
     * فحص ملفات الأمان
     */
    async checkSecurityFiles() {
        const securityFiles = [
            'security_audit.log',
            'backup_service.log',
            'security_alerts.log'
        ];

        for (const file of securityFiles) {
            if (fs.existsSync(file)) {
                const stats = fs.statSync(file);
                const hoursOld = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
                
                if (hoursOld > 24) {
                    this.addAlert('MEDIUM', `ملف أمان قديم: ${file}`,
                        `لم يتم تحديث ${file} منذ ${hoursOld.toFixed(1)} ساعة.`);
                }
            } else {
                this.addAlert('HIGH', `ملف أمان مفقود: ${file}`,
                    `ملف الأمان ${file} غير موجود.`);
            }
        }
    }

    /**
     * إضافة إشعار
     */
    addAlert(level, title, message) {
        const alert = {
            id: Date.now() + Math.random(),
            level: level,
            title: title,
            message: message,
            timestamp: new Date().toISOString(),
            icon: this.alertLevels[level].icon,
            color: this.alertLevels[level].color
        };

        this.alerts.push(alert);
        
        // تسجيل في ملف الإشعارات
        this.logAlert(alert);
    }

    /**
     * تسجيل الإشعار في ملف
     */
    logAlert(alert) {
        try {
            const logEntry = JSON.stringify(alert) + '\n';
            fs.appendFileSync('security_alerts.log', logEntry);
        } catch (error) {
            console.error('فشل في تسجيل الإشعار:', error.message);
        }
    }

    /**
     * تحليل مستوى حماية السكريپت
     */
    analyzeScriptProtection(content) {
        let score = 0;
        
        // فحص وجود تأكيدات
        if (content.includes('confirm') || content.includes('requiredConfirmations')) score += 2;
        
        // فحص وجود فحص البيئة
        if (content.includes('NODE_ENV') || content.includes('production')) score += 2;
        
        // فحص وجود نسخ احتياطية
        if (content.includes('backup') || content.includes('createBackup')) score += 2;
        
        // فحص وجود تسجيل
        if (content.includes('log') || content.includes('audit')) score += 1;
        
        // فحص وجود انتظار
        if (content.includes('setTimeout') || content.includes('delay')) score += 1;
        
        // فحص وجود تشفير أو حماية إضافية
        if (content.includes('encrypt') || content.includes('hash') || content.includes('secure')) score += 2;
        
        return score;
    }

    /**
     * الحصول على أهم الإشعارات
     */
    getTopAlerts(limit = 5) {
        return this.alerts
            .filter(alert => alert.level !== 'INFO')
            .slice(0, limit);
    }

    /**
     * الحصول على إحصائيات الإشعارات
     */
    getAlertStats() {
        const stats = {
            total: this.alerts.length,
            critical: this.alerts.filter(a => a.level === 'CRITICAL').length,
            high: this.alerts.filter(a => a.level === 'HIGH').length,
            medium: this.alerts.filter(a => a.level === 'MEDIUM').length,
            low: this.alerts.filter(a => a.level === 'LOW').length,
            info: this.alerts.filter(a => a.level === 'INFO').length
        };

        stats.dangerScore = (stats.critical * 4) + (stats.high * 3) + (stats.medium * 2) + stats.low;
        stats.securityLevel = Math.max(0, 100 - (stats.dangerScore * 5));

        return stats;
    }

    /**
     * تصدير الإشعارات للمخطط
     */
    exportForDiagram() {
        const stats = this.getAlertStats();
        const topAlerts = this.getTopAlerts();
        
        return {
            alerts: this.alerts,
            topAlerts: topAlerts,
            stats: stats,
            timestamp: new Date().toISOString()
        };
    }
}

// تشغيل النظام
if (require.main === module) {
    const alertSystem = new LiveSecurityAlertsSystem();
    
    alertSystem.performSecurityScan().then(alerts => {
        console.log('\n📊 نتائج الفحص الأمني:');
        
        const stats = alertSystem.getAlertStats();
        console.log(`🎯 مستوى الأمان: ${stats.securityLevel}%`);
        console.log(`🚨 إشعارات حرجة: ${stats.critical}`);
        console.log(`⚠️ إشعارات مهمة: ${stats.high}`);
        console.log(`⚡ إشعارات متوسطة: ${stats.medium}`);
        
        console.log('\n🔝 أهم الإشعارات:');
        const topAlerts = alertSystem.getTopAlerts(3);
        topAlerts.forEach((alert, index) => {
            console.log(`${index + 1}. ${alert.icon} ${alert.title}`);
            console.log(`   ${alert.message}`);
        });
    });
}

module.exports = LiveSecurityAlertsSystem;