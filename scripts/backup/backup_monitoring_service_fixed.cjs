#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class BackupMonitoringService {
    constructor() {
        this.logFile = './backup_monitoring.log';
        this.monitoringInterval = 30 * 60 * 1000; // 30 دقيقة
        
        console.log('🔍 Starting Backup Monitoring Service...');
        this.start();
    }

    async start() {
        console.log('🚀 خدمة مراقبة النسخ الاحتياطية تعمل...');
        
        // فحص أولي
        await this.performHealthCheck();
        
        // مراقبة دورية
        setInterval(async () => {
            await this.performHealthCheck();
        }, this.monitoringInterval);
        
        console.log(`⏰ المراقبة مجدولة كل ${this.monitoringInterval / 60000} دقيقة`);
    }

    async performHealthCheck() {
        console.log('\n🏥 Performing System Health Check...');
        console.log('═'.repeat(50));
        
        const report = {
            timestamp: new Date().toISOString(),
            status: 'healthy',
            checks: {}
        };

        // فحص قاعدة البيانات الرئيسية
        if (fs.existsSync('./classroom.db')) {
            const stats = fs.statSync('./classroom.db');
            report.checks.mainDatabase = {
                exists: true,
                size: `${(stats.size / 1024).toFixed(2)} KB`,
                lastModified: stats.mtime
            };
            console.log('✅ قاعدة البيانات الرئيسية: موجودة');
        } else {
            report.checks.mainDatabase = { exists: false };
            report.status = 'warning';
            console.log('⚠️  قاعدة البيانات الرئيسية: غير موجودة');
        }

        // فحص النسخ الاحتياطية
        const backupDir = './automated_backups';
        if (fs.existsSync(backupDir)) {
            const backups = fs.readdirSync(backupDir);
            report.checks.backups = {
                directory: 'exists',
                count: backups.length,
                latest: backups.length > 0 ? backups[backups.length - 1] : null
            };
            console.log(`✅ النسخ الاحتياطية: ${backups.length} نسخة موجودة`);
        } else {
            report.checks.backups = { directory: 'missing' };
            report.status = 'error';
            console.log('❌ مجلد النسخ الاحتياطية غير موجود');
        }

        // تسجيل التقرير
        this.logReport(report);
        
        console.log(`📊 الحالة العامة: ${report.status.toUpperCase()}`);
        console.log('═'.repeat(50));
    }

    logReport(report) {
        const logEntry = `${report.timestamp} - Status: ${report.status}\n`;
        fs.appendFileSync(this.logFile, logEntry);
    }
}

// تشغيل الخدمة
new BackupMonitoringService();