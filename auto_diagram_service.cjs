#!/usr/bin/env node
/**
 * خدمة تحديث المخطط الأمني التلقائية
 * Auto Security Diagram Update Service
 * تقوم بمراقبة التغييرات وتحديث المخطط تلقائياً
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

class AutoDiagramUpdateService {
    constructor() {
        this.isRunning = false;
        this.lastUpdate = null;
        this.updateInterval = 120000; // 2 دقيقة
        this.watchedFiles = [
            'security_audit.log',
            'backup_service.log', 
            'recovery_audit.log',
            'security_alerts.log',
            'backend/reset_db.js',
            'backend/manual_migration.js'
        ];
        this.watchedDirs = [
            'security_backups',
            'automated_backups',
            'emergency_environment_backups'
        ];
        
        this.changeDetected = false;
        this.watchers = [];
    }

    /**
     * بدء خدمة المراقبة التلقائية
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️ الخدمة تعمل بالفعل');
            return;
        }

        console.log('🚀 بدء خدمة تحديث المخطط الأمني التلقائية...');
        this.isRunning = true;

        // إنشاء ملف الحالة
        this.createStatusFile();

        // بدء مراقبة الملفات
        this.startFileWatching();

        // بدء مراقبة المجلدات
        this.startDirectoryWatching();

        // بدء التحديث الدوري
        this.startPeriodicUpdates();

        console.log('✅ خدمة المراقبة التلقائية نشطة');
        console.log(`🔄 التحديث كل ${this.updateInterval / 60000} دقيقة`);
        console.log('📁 الملفات المراقبة:', this.watchedFiles.length);
        console.log('📂 المجلدات المراقبة:', this.watchedDirs.length);

        // معالجة إيقاف البرنامج بشكل صحيح
        process.on('SIGINT', () => this.stop());
        process.on('SIGTERM', () => this.stop());
    }

    /**
     * إيقاف خدمة المراقبة
     */
    stop() {
        if (!this.isRunning) {
            console.log('ℹ️ الخدمة متوقفة بالفعل');
            return;
        }

        console.log('🛑 إيقاف خدمة المراقبة التلقائية...');
        this.isRunning = false;

        // إغلاق جميع المراقبات
        this.watchers.forEach(watcher => {
            try {
                watcher.close();
            } catch (error) {
                // تجاهل الأخطاء
            }
        });
        this.watchers = [];

        // إغلاق التحديث الدوري
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }

        // حذف ملف الحالة
        try {
            if (fs.existsSync('auto_diagram_service.status')) {
                fs.unlinkSync('auto_diagram_service.status');
            }
        } catch (error) {
            // تجاهل الخطأ
        }

        console.log('✅ تم إيقاف الخدمة بنجاح');
        process.exit(0);
    }

    /**
     * إنشاء ملف حالة الخدمة
     */
    createStatusFile() {
        const status = {
            pid: process.pid,
            startTime: new Date().toISOString(),
            isRunning: true,
            lastUpdate: null,
            updatesCount: 0,
            watchedFiles: this.watchedFiles,
            watchedDirs: this.watchedDirs
        };

        fs.writeFileSync('auto_diagram_service.status', JSON.stringify(status, null, 2));
    }

    /**
     * تحديث ملف حالة الخدمة
     */
    updateStatusFile() {
        try {
            if (fs.existsSync('auto_diagram_service.status')) {
                const status = JSON.parse(fs.readFileSync('auto_diagram_service.status', 'utf-8'));
                status.lastUpdate = new Date().toISOString();
                status.updatesCount = (status.updatesCount || 0) + 1;
                status.isRunning = this.isRunning;
                
                fs.writeFileSync('auto_diagram_service.status', JSON.stringify(status, null, 2));
            }
        } catch (error) {
            console.error('⚠️ خطأ في تحديث ملف الحالة:', error.message);
        }
    }

    /**
     * بدء مراقبة الملفات
     */
    startFileWatching() {
        this.watchedFiles.forEach(filePath => {
            if (fs.existsSync(filePath)) {
                try {
                    const watcher = fs.watch(filePath, (eventType, filename) => {
                        if (eventType === 'change') {
                            console.log(`📝 تم تحديث الملف: ${filePath}`);
                            this.triggerUpdate(`file_change:${filePath}`);
                        }
                    });
                    
                    this.watchers.push(watcher);
                    console.log(`👁️ مراقبة الملف: ${filePath}`);
                } catch (error) {
                    console.error(`⚠️ خطأ في مراقبة الملف ${filePath}:`, error.message);
                }
            }
        });
    }

    /**
     * بدء مراقبة المجلدات
     */
    startDirectoryWatching() {
        this.watchedDirs.forEach(dirPath => {
            if (fs.existsSync(dirPath)) {
                try {
                    const watcher = fs.watch(dirPath, { recursive: true }, (eventType, filename) => {
                        if (eventType === 'rename') {
                            console.log(`📂 تغيير في المجلد: ${dirPath}/${filename}`);
                            this.triggerUpdate(`dir_change:${dirPath}/${filename}`);
                        }
                    });
                    
                    this.watchers.push(watcher);
                    console.log(`👁️ مراقبة المجلد: ${dirPath}`);
                } catch (error) {
                    console.error(`⚠️ خطأ في مراقبة المجلد ${dirPath}:`, error.message);
                }
            }
        });
    }

    /**
     * بدء التحديث الدوري
     */
    startPeriodicUpdates() {
        this.updateTimer = setInterval(() => {
            if (this.changeDetected || this.shouldForceUpdate()) {
                this.executeUpdate('periodic_update');
            }
        }, this.updateInterval);
    }

    /**
     * تحديد ما إذا كان يجب فرض التحديث
     */
    shouldForceUpdate() {
        if (!this.lastUpdate) return true;
        
        const timeSinceLastUpdate = Date.now() - this.lastUpdate;
        const forceUpdateInterval = 5 * 60 * 1000; // 5 دقائق
        
        return timeSinceLastUpdate > forceUpdateInterval;
    }

    /**
     * تشغيل التحديث
     */
    triggerUpdate(reason) {
        if (!this.isRunning) return;
        
        this.changeDetected = true;
        console.log(`🔔 تم اكتشاف تغيير: ${reason}`);
        
        // تأخير قصير لتجميع التغييرات المتتالية
        clearTimeout(this.updateDelayTimer);
        this.updateDelayTimer = setTimeout(() => {
            this.executeUpdate(reason);
        }, 2000);
    }

    /**
     * تنفيذ التحديث الفعلي
     */
    async executeUpdate(reason) {
        if (!this.isRunning) return;
        
        console.log(`🔄 تحديث المخطط الأمني... (السبب: ${reason})`);
        
        try {
            // تشغيل مولد المخطط
            const process = spawn('node', ['live_security_diagram_generator.cjs'], {
                stdio: 'pipe'
            });

            let output = '';
            let errorOutput = '';

            process.stdout.on('data', (data) => {
                output += data.toString();
            });

            process.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            process.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ تم تحديث المخطط بنجاح');
                    this.lastUpdate = Date.now();
                    this.changeDetected = false;
                    
                    // تسجيل التحديث في لوق خاص
                    this.logUpdate(reason, 'SUCCESS', output);
                    
                    // تحديث ملف الحالة
                    this.updateStatusFile();
                    
                    // إرسال إشعار إذا كان المتصفح مفتوحاً
                    this.notifyBrowser();
                    
                } else {
                    console.error('❌ فشل في تحديث المخطط');
                    if (errorOutput) {
                        console.error('الخطأ:', errorOutput);
                    }
                    this.logUpdate(reason, 'FAILED', errorOutput);
                }
            });

        } catch (error) {
            console.error('❌ خطأ في تنفيذ التحديث:', error.message);
            this.logUpdate(reason, 'ERROR', error.message);
        }
    }

    /**
     * تسجيل عملية التحديث
     */
    logUpdate(reason, status, details) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            reason: reason,
            status: status,
            details: details,
            pid: process.pid
        };

        try {
            const logLine = JSON.stringify(logEntry) + '\n';
            fs.appendFileSync('diagram_updates.log', logLine);
        } catch (error) {
            console.error('⚠️ خطأ في تسجيل التحديث:', error.message);
        }
    }

    /**
     * إشعار المتصفح بالتحديث (إذا كان هناك websocket أو SSE)
     */
    notifyBrowser() {
        // يمكن تنفيذ نظام إشعارات للمتصفح هنا
        // لإعلام المستخدم بتحديث المخطط تلقائياً
        console.log('📡 إشعار المتصفح بالتحديث (إذا كان متاحاً)');
    }

    /**
     * الحصول على حالة الخدمة
     */
    getStatus() {
        try {
            if (fs.existsSync('auto_diagram_service.status')) {
                return JSON.parse(fs.readFileSync('auto_diagram_service.status', 'utf-8'));
            }
        } catch (error) {
            console.error('خطأ في قراءة ملف الحالة:', error.message);
        }
        return null;
    }

    /**
     * عرض إحصائيات الخدمة
     */
    showStats() {
        const status = this.getStatus();
        if (!status) {
            console.log('❌ لا توجد معلومات حالة متاحة');
            return;
        }

        console.log('\n📊 إحصائيات خدمة التحديث التلقائي:');
        console.log(`🆔 معرف العملية: ${status.pid}`);
        console.log(`⏰ وقت البدء: ${new Date(status.startTime).toLocaleString('ar-SA')}`);
        console.log(`🔄 عدد التحديثات: ${status.updatesCount || 0}`);
        console.log(`📅 آخر تحديث: ${status.lastUpdate ? new Date(status.lastUpdate).toLocaleString('ar-SA') : 'لم يتم بعد'}`);
        console.log(`📁 الملفات المراقبة: ${status.watchedFiles.length}`);
        console.log(`📂 المجلدات المراقبة: ${status.watchedDirs.length}`);
        console.log(`🟢 الحالة: ${status.isRunning ? 'نشط' : 'متوقف'}`);

        // عرض آخر التحديثات
        if (fs.existsSync('diagram_updates.log')) {
            console.log('\n📝 آخر التحديثات:');
            const logs = fs.readFileSync('diagram_updates.log', 'utf-8')
                .trim().split('\n')
                .filter(line => line)
                .slice(-5)
                .map(line => {
                    try {
                        return JSON.parse(line);
                    } catch {
                        return null;
                    }
                })
                .filter(log => log);

            logs.forEach(log => {
                const time = new Date(log.timestamp).toLocaleTimeString('ar-SA');
                const status = log.status === 'SUCCESS' ? '✅' : log.status === 'FAILED' ? '❌' : '⚠️';
                console.log(`  ${status} ${time} - ${log.reason} (${log.status})`);
            });
        }
    }
}

// معالجة وسائط سطر الأوامر
const args = process.argv.slice(2);
const command = args[0];

const service = new AutoDiagramUpdateService();

switch (command) {
    case 'start':
        service.start();
        break;
        
    case 'stop':
        // محاولة إيقاف الخدمة الحالية
        const status = service.getStatus();
        if (status && status.pid && status.isRunning) {
            try {
                process.kill(status.pid, 'SIGTERM');
                console.log(`✅ تم إرسال إشارة إيقاف للعملية ${status.pid}`);
            } catch (error) {
                console.error('⚠️ خطأ في إيقاف الخدمة:', error.message);
                console.log('🔄 محاولة حذف ملف الحالة...');
                try {
                    fs.unlinkSync('auto_diagram_service.status');
                    console.log('✅ تم حذف ملف الحالة');
                } catch (deleteError) {
                    console.error('❌ فشل في حذف ملف الحالة:', deleteError.message);
                }
            }
        } else {
            console.log('ℹ️ لا توجد خدمة نشطة للإيقاف');
        }
        break;
        
    case 'status':
    case 'stats':
        service.showStats();
        break;
        
    case 'restart':
        console.log('🔄 إعادة تشغيل الخدمة...');
        // إيقاف الخدمة الحالية أولاً
        const currentStatus = service.getStatus();
        if (currentStatus && currentStatus.pid) {
            try {
                process.kill(currentStatus.pid, 'SIGTERM');
                console.log('⏳ انتظار إيقاف الخدمة الحالية...');
                
                setTimeout(() => {
                    service.start();
                }, 2000);
            } catch (error) {
                console.log('🚀 بدء خدمة جديدة...');
                service.start();
            }
        } else {
            service.start();
        }
        break;
        
    case 'update':
        console.log('🔄 تحديث فوري للمخطط...');
        service.executeUpdate('manual_trigger');
        break;
        
    default:
        console.log(`
🛡️ خدمة تحديث المخطط الأمني التلقائية

الاستخدام:
  node auto_diagram_service.cjs <command>

الأوامر المتاحة:
  start     - بدء الخدمة
  stop      - إيقاف الخدمة  
  restart   - إعادة تشغيل الخدمة
  status    - عرض حالة الخدمة
  stats     - عرض إحصائيات مفصلة
  update    - تحديث فوري للمخطط

أمثلة:
  node auto_diagram_service.cjs start
  node auto_diagram_service.cjs status
  node auto_diagram_service.cjs stop
        `);
        break;
}

module.exports = AutoDiagramUpdateService;