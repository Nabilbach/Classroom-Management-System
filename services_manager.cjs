#!/usr/bin/env node
/**
 * مدير الخدمات الذكي
 * Smart Services Manager - تشغيل جميع الخدمات مع مراقبة
 */

const { spawn } = require('child_process');
const fs = require('fs');

class ServicesManager {
    constructor() {
           node services_manager.cjs start        - تشغيل جميع الخدمات');
            console.log('  node services_manager.cjs backup-only  - خدمة النسخ فقط');
            console.log('  node services_manager.cjs monitor-only - خدمة المراقبة فقط');
            console.log('  node services_manager.cjs immediate    - نسخة فورية');
            console.log('  node services_manager.cjs status       - عرض الحالة');this.services = new Map();
        this.isRunning = false;
    }

    /**
     * تشغيل خدمة النسخ الاحتياطية التلقائية
     */
    startBackupService() {
        console.log('🤖 تشغيل خدمة النسخ الاحتياطية...');
        
        const backupProcess = spawn('node', ['automated_backup_service.cjs', 'start'], {
            stdio: ['inherit', 'pipe', 'pipe'],
            cwd: process.cwd()
        });

        backupProcess.stdout.on('data', (data) => {
            console.log(`[النسخ الاحتياطي] ${data.toString().trim()}`);
        });

        backupProcess.stderr.on('data', (data) => {
            console.error(`[النسخ الاحتياطي] خطأ: ${data.toString().trim()}`);
        });

        backupProcess.on('close', (code) => {
            console.log(`[النسخ الاحتياطي] انتهت العملية بالكود: ${code}`);
            
            // إعادة تشغيل تلقائي في حالة الإغلاق غير المتوقع
            if (code !== 0 && this.isRunning) {
                console.log('🔄 إعادة تشغيل خدمة النسخ الاحتياطي...');
                setTimeout(() => this.startBackupService(), 5000);
            }
        });

        this.services.set('backup', backupProcess);
        return backupProcess;
    }

    /**
     * تشغيل خدمة مراقبة النسخ الاحتياطية
     */
    startMonitoringService() {
        console.log('👁️ تشغيل خدمة المراقبة...');
        
        const monitorProcess = spawn('node', ['backup_monitoring_service.cjs'], {
            stdio: ['inherit', 'pipe', 'pipe'],
            cwd: process.cwd()
        });

        monitorProcess.stdout.on('data', (data) => {
            console.log(`[المراقبة] ${data.toString().trim()}`);
        });

        monitorProcess.stderr.on('data', (data) => {
            console.error(`[المراقبة] خطأ: ${data.toString().trim()}`);
        });

        monitorProcess.on('close', (code) => {
            console.log(`[المراقبة] انتهت العملية بالكود: ${code}`);
            
            // إعادة تشغيل تلقائي
            if (code !== 0 && this.isRunning) {
                console.log('🔄 إعادة تشغيل خدمة المراقبة...');
                setTimeout(() => this.startMonitoringService(), 5000);
            }
        });

        this.services.set('monitoring', monitorProcess);
        return monitorProcess;
    }

    /**
     * تشغيل جميع الخدمات
     */
    startAllServices() {
        console.log('\n🚀 بدء تشغيل جميع خدمات النسخ الاحتياطي...\n');
        
        this.isRunning = true;

        // نسخة احتياطية فورية
        this.createImmediateBackup();

        // تشغيل الخدمات
        setTimeout(() => {
            this.startBackupService();
        }, 2000);

        setTimeout(() => {
            this.startMonitoringService();
        }, 4000);

        // معالجة إيقاف النظام
        process.on('SIGINT', () => {
            this.stopAllServices();
        });

        process.on('SIGTERM', () => {
            this.stopAllServices();
        });

        console.log('✅ جميع الخدمات في حالة تشغيل');
        console.log('📝 لعرض الحالة: npm run backup:status');
        console.log('🛑 للإيقاف: Ctrl+C\n');

        // إبقاء العملية نشطة
        setInterval(() => {
            this.checkServicesHealth();
        }, 60000); // فحص كل دقيقة
    }

    /**
     * إنشاء نسخة احتياطية فورية
     */
    createImmediateBackup() {
        console.log('⚡ إنشاء نسخة احتياطية فورية...');
        
        const backupProcess = spawn('node', ['automated_backup_service.cjs', 'backup'], {
            stdio: 'inherit',
            cwd: process.cwd()
        });

        backupProcess.on('close', (code) => {
            if (code === 0) {
                console.log('✅ تم إنشاء النسخة الاحتياطية الفورية بنجاح');
            } else {
                console.error('❌ فشل في إنشاء النسخة الاحتياطية الفورية');
            }
        });
    }

    /**
     * فحص صحة الخدمات
     */
    checkServicesHealth() {
        const runningServices = Array.from(this.services.keys()).filter(name => {
            const process = this.services.get(name);
            return process && !process.killed;
        });

        if (runningServices.length < 2) {
            console.log(`⚠️ تحذير: ${runningServices.length}/2 خدمة تعمل`);
        }
    }

    /**
     * إيقاف جميع الخدمات
     */
    stopAllServices() {
        console.log('\n🛑 إيقاف جميع الخدمات...');
        
        this.isRunning = false;

        this.services.forEach((process, name) => {
            if (process && !process.killed) {
                console.log(`⏹️ إيقاف ${name}...`);
                process.kill('SIGINT');
            }
        });

        setTimeout(() => {
            console.log('✅ تم إيقاف جميع الخدمات');
            process.exit(0);
        }, 2000);
    }

    /**
     * عرض حالة الخدمات
     */
    showStatus() {
        console.log('\n📊 حالة خدمات النسخ الاحتياطي');
        console.log('='.repeat(40));

        // حالة الخدمات
        const services = ['backup', 'monitoring'];
        services.forEach(name => {
            const process = this.services.get(name);
            const status = (process && !process.killed) ? '✅ تعمل' : '❌ متوقفة';
            console.log(`${name}: ${status}`);
        });

        // إحصائيات النسخ الاحتياطية
        const backupDirs = ['./automated_backups', './security_backups'];
        let totalBackups = 0;
        
        backupDirs.forEach(dir => {
            if (fs.existsSync(dir)) {
                const backups = fs.readdirSync(dir);
                totalBackups += backups.length;
                console.log(`📦 ${dir}: ${backups.length} نسخة`);
            }
        });

        console.log(`📊 إجمالي النسخ: ${totalBackups}`);

        // حالة قاعدة البيانات
        if (fs.existsSync('./classroom.db')) {
            const stats = fs.statSync('./classroom.db');
            console.log(`💾 قاعدة البيانات: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        }
    }
}

// تشغيل المدير
if (require.main === module) {
    const manager = new ServicesManager();
    
    const command = process.argv[2];
    
    switch(command) {
        case 'start':
            manager.startAllServices();
            break;
        case 'backup-only':
            manager.startBackupService();
            break;
        case 'monitor-only':
            manager.startMonitoringService();
            break;
        case 'immediate':
            manager.createImmediateBackup();
            break;
        case 'status':
            manager.showStatus();
            break;
        default:
            console.log('\n🎛️ مدير خدمات النسخ الاحتياطي');
            console.log('الاستخدام:');
            console.log('  node services_manager.js start        - تشغيل جميع الخدمات');
            console.log('  node services_manager.js backup-only  - خدمة النسخ فقط');
            console.log('  node services_manager.js monitor-only - خدمة المراقبة فقط');
            console.log('  node services_manager.js immediate    - نسخة فورية');
            console.log('  node services_manager.js status       - عرض الحالة');
    }
}

module.exports = ServicesManager;