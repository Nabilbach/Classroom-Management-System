#!/usr/bin/env node
/**
 * خدمة النسخ الاحتياطية التلقائية
 * Automated Backup Service - نسخ احتياطية مجدولة وذكية
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class AutomatedBackupService {
    constructor() {
        this.backupDir = './automated_backups';
        this.maxBackupsToKeep = 7; // احتفظ بآخر 7 أيام
        this.backupSchedule = {
            daily: true,
            hourly: false,
            interval: 24 * 60 * 60 * 1000 // 24 ساعة
        };
        
        this.initializeService();
    }

    /**
     * تهيئة الخدمة
     */
    initializeService() {
        this.ensureBackupDirectory();
        this.loadBackupConfig();
        
        console.log('⚡ تم تفعيل خدمة النسخ الاحتياطية التلقائية');
        this.logBackupEvent('SERVICE_STARTED', 'تم تفعيل خدمة النسخ الاحتياطية');
    }

    /**
     * إنشاء مجلد النسخ الاحتياطية
     */
    ensureBackupDirectory() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
            console.log(`📁 تم إنشاء مجلد النسخ التلقائية: ${this.backupDir}`);
        }
    }

    /**
     * تحميل إعدادات النسخ الاحتياطية
     */
    loadBackupConfig() {
        const configPath = './backup_config.json';
        
        if (fs.existsSync(configPath)) {
            try {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
                this.backupSchedule = { ...this.backupSchedule, ...config };
                console.log('⚙️ تم تحميل إعدادات النسخ الاحتياطية');
            } catch (error) {
                console.log('⚠️ خطأ في تحميل إعدادات النسخ، استخدام الإعدادات الافتراضية');
            }
        } else {
            // إنشاء ملف إعدادات افتراضي
            this.saveBackupConfig();
        }
    }

    /**
     * حفظ إعدادات النسخ الاحتياطية
     */
    saveBackupConfig() {
        const configPath = './backup_config.json';
        const config = {
            ...this.backupSchedule,
            maxBackupsToKeep: this.maxBackupsToKeep,
            lastUpdated: new Date().toISOString()
        };
        
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log('💾 تم حفظ إعدادات النسخ الاحتياطية');
    }

    /**
     * تحديد الملفات المطلوب نسخها احتياطياً
     */
    getFilesToBackup() {
        const files = [];
        
        // قواعد البيانات
        const dbFiles = [
            'classroom.db',
            'classroom_dev.db',
            'classroom_test.db'
        ];
        
        // ملفات الإعداد المهمة
        const configFiles = [
            'package.json',
            'tsconfig.json',
            'vite.config.js',
            '.env.development',
            '.env.production',
            '.env.testing',
            'backup_config.json'
        ];
        
        // المجلدات المهمة
        const importantDirectories = [
            'backend/config',
            'backend/models',
            'backend/routes',
            'src/components',
            'src/services'
        ];

        // فحص الملفات الموجودة
        [...dbFiles, ...configFiles].forEach(file => {
            if (fs.existsSync(file)) {
                const stats = fs.statSync(file);
                files.push({
                    path: file,
                    type: 'file',
                    size: stats.size,
                    modified: stats.mtime
                });
            }
        });

        // فحص المجلدات الموجودة
        importantDirectories.forEach(dir => {
            if (fs.existsSync(dir)) {
                files.push({
                    path: dir,
                    type: 'directory',
                    size: this.calculateDirectorySize(dir),
                    modified: this.getDirectoryLastModified(dir)
                });
            }
        });

        return files;
    }

    /**
     * حساب حجم المجلد
     */
    calculateDirectorySize(dirPath) {
        let totalSize = 0;
        
        const calculateSize = (currentPath) => {
            const items = fs.readdirSync(currentPath);
            
            items.forEach(item => {
                const itemPath = path.join(currentPath, item);
                const stats = fs.statSync(itemPath);
                
                if (stats.isDirectory()) {
                    calculateSize(itemPath);
                } else {
                    totalSize += stats.size;
                }
            });
        };
        
        try {
            calculateSize(dirPath);
        } catch (error) {
            console.log(`⚠️ خطأ في حساب حجم المجلد ${dirPath}:`, error.message);
        }
        
        return totalSize;
    }

    /**
     * الحصول على آخر تاريخ تعديل للمجلد
     */
    getDirectoryLastModified(dirPath) {
        let latestModified = new Date(0);
        
        const checkModified = (currentPath) => {
            const items = fs.readdirSync(currentPath);
            
            items.forEach(item => {
                const itemPath = path.join(currentPath, item);
                const stats = fs.statSync(itemPath);
                
                if (stats.mtime > latestModified) {
                    latestModified = stats.mtime;
                }
                
                if (stats.isDirectory()) {
                    checkModified(itemPath);
                }
            });
        };
        
        try {
            checkModified(dirPath);
        } catch (error) {
            console.log(`⚠️ خطأ في فحص تاريخ التعديل ${dirPath}:`, error.message);
        }
        
        return latestModified;
    }

    /**
     * إنشاء نسخة احتياطية ذكية
     */
    async createSmartBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `auto_backup_${timestamp}`;
        const backupPath = path.join(this.backupDir, backupName);
        
        console.log('🤖 بدء النسخ الاحتياطي الذكي...');
        
        try {
            // إنشاء مجلد النسخة الاحتياطية
            fs.mkdirSync(backupPath, { recursive: true });

            // الحصول على قائمة الملفات
            const filesToBackup = this.getFilesToBackup();
            
            if (filesToBackup.length === 0) {
                console.log('⚠️ لا توجد ملفات للنسخ الاحتياطي');
                return null;
            }

            const backupReport = {
                timestamp: new Date().toISOString(),
                type: 'automated_smart_backup',
                files: [],
                directories: [],
                totalSize: 0,
                checksums: {},
                status: 'in_progress'
            };

            console.log(`📦 نسخ ${filesToBackup.length} عنصر...`);

            // نسخ الملفات والمجلدات
            for (const item of filesToBackup) {
                const destPath = path.join(backupPath, item.path);
                const destDir = path.dirname(destPath);

                // إنشاء المجلد الهدف إذا لم يكن موجوداً
                if (!fs.existsSync(destDir)) {
                    fs.mkdirSync(destDir, { recursive: true });
                }

                if (item.type === 'file') {
                    // نسخ الملف
                    fs.copyFileSync(item.path, destPath);
                    
                    // حساب checksum
                    const hash = this.calculateFileHash(item.path);
                    
                    backupReport.files.push({
                        source: item.path,
                        destination: destPath,
                        size: item.size,
                        modified: item.modified.toISOString(),
                        hash: hash
                    });
                    
                    backupReport.checksums[item.path] = hash;
                    backupReport.totalSize += item.size;
                    
                    console.log(`✅ ملف: ${item.path} (${(item.size / 1024).toFixed(2)} KB)`);
                    
                } else if (item.type === 'directory') {
                    // نسخ المجلد
                    this.copyDirectoryRecursive(item.path, destPath);
                    
                    backupReport.directories.push({
                        source: item.path,
                        destination: destPath,
                        size: item.size
                    });
                    
                    backupReport.totalSize += item.size;
                    console.log(`✅ مجلد: ${item.path} (${(item.size / 1024).toFixed(2)} KB)`);
                }
            }

            // إنهاء التقرير
            backupReport.status = 'completed';
            backupReport.completedAt = new Date().toISOString();
            backupReport.backupName = backupName;

            // حفظ التقرير
            const reportPath = path.join(backupPath, 'backup_report.json');
            fs.writeFileSync(reportPath, JSON.stringify(backupReport, null, 2));

            // إنشاء ملف README
            const readmePath = path.join(backupPath, 'README.md');
            const readmeContent = this.generateBackupReadme(backupReport);
            fs.writeFileSync(readmePath, readmeContent);

            // تسجيل النجاح
            this.logBackupEvent('BACKUP_CREATED', `تم إنشاء النسخة الاحتياطية: ${backupName}`, {
                totalSize: backupReport.totalSize,
                fileCount: backupReport.files.length,
                directoryCount: backupReport.directories.length
            });

            console.log(`\n✅ تم إنشاء النسخة الاحتياطية بنجاح!`);
            console.log(`📍 المسار: ${backupPath}`);
            console.log(`📊 الحجم: ${(backupReport.totalSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`🗂️ الملفات: ${backupReport.files.length}`);
            console.log(`📁 المجلدات: ${backupReport.directories.length}`);

            return backupReport;

        } catch (error) {
            console.error('❌ خطأ في النسخ الاحتياطي:', error);
            this.logBackupEvent('BACKUP_FAILED', `فشل في النسخ الاحتياطي: ${error.message}`);
            return null;
        }
    }

    /**
     * نسخ مجلد بشكل تدريجي
     */
    copyDirectoryRecursive(source, destination) {
        if (!fs.existsSync(destination)) {
            fs.mkdirSync(destination, { recursive: true });
        }

        const items = fs.readdirSync(source);
        
        items.forEach(item => {
            const sourcePath = path.join(source, item);
            const destPath = path.join(destination, item);
            
            if (fs.statSync(sourcePath).isDirectory()) {
                this.copyDirectoryRecursive(sourcePath, destPath);
            } else {
                fs.copyFileSync(sourcePath, destPath);
            }
        });
    }

    /**
     * حساب checksum للملف
     */
    calculateFileHash(filePath) {
        const fileBuffer = fs.readFileSync(filePath);
        const hash = crypto.createHash('sha256');
        hash.update(fileBuffer);
        return hash.digest('hex');
    }

    /**
     * إنشاء README للنسخة الاحتياطية
     */
    generateBackupReadme(report) {
        return `# نسخة احتياطية تلقائية - ${report.backupName}

## معلومات النسخة الاحتياطية
- **النوع**: نسخة احتياطية تلقائية ذكية
- **تاريخ الإنشاء**: ${new Date(report.timestamp).toLocaleString('ar-SA')}
- **الحالة**: ${report.status}
- **الحجم الإجمالي**: ${(report.totalSize / 1024 / 1024).toFixed(2)} MB

## الملفات المحفوظة (${report.files.length})
${report.files.map(file => `- \`${file.source}\` (${(file.size / 1024).toFixed(2)} KB)`).join('\n')}

## المجلدات المحفوظة (${report.directories.length})
${report.directories.map(dir => `- \`${dir.source}\` (${(dir.size / 1024).toFixed(2)} KB)`).join('\n')}

## التحقق من السلامة
للتحقق من سلامة النسخة الاحتياطية، استخدم checksums المحفوظة في \`backup_report.json\`.

## الاستعادة
لاستعادة هذه النسخة الاحتياطية:
1. أوقف جميع خدمات النظام
2. انسخ الملفات والمجلدات إلى مواقعها الأصلية
3. تحقق من الأذونات
4. أعد تشغيل النظام

تم إنشاؤها بواسطة خدمة النسخ الاحتياطية التلقائية 🤖
`;
    }

    /**
     * تنظيف النسخ الاحتياطية القديمة
     */
    cleanupOldBackups() {
        console.log('🧹 تنظيف النسخ الاحتياطية القديمة...');
        
        try {
            if (!fs.existsSync(this.backupDir)) {
                return;
            }

            const backupFolders = fs.readdirSync(this.backupDir)
                .map(name => ({
                    name: name,
                    path: path.join(this.backupDir, name),
                    created: fs.statSync(path.join(this.backupDir, name)).birthtime
                }))
                .sort((a, b) => b.created - a.created); // ترتيب من الأحدث إلى الأقدم

            if (backupFolders.length <= this.maxBackupsToKeep) {
                console.log(`✅ عدد النسخ الاحتياطية (${backupFolders.length}) ضمن الحد المسموح (${this.maxBackupsToKeep})`);
                return;
            }

            // حذف النسخ الزائدة
            const foldersToDelete = backupFolders.slice(this.maxBackupsToKeep);
            
            foldersToDelete.forEach(folder => {
                this.deleteDirectoryRecursive(folder.path);
                console.log(`🗑️ تم حذف النسخة القديمة: ${folder.name}`);
                
                this.logBackupEvent('BACKUP_DELETED', `تم حذف النسخة القديمة: ${folder.name}`, {
                    createdAt: folder.created.toISOString()
                });
            });

            console.log(`✅ تم تنظيف ${foldersToDelete.length} نسخة احتياطية قديمة`);

        } catch (error) {
            console.error('❌ خطأ في تنظيف النسخ الاحتياطية:', error);
        }
    }

    /**
     * حذف مجلد بشكل تدريجي
     */
    deleteDirectoryRecursive(dirPath) {
        if (fs.existsSync(dirPath)) {
            fs.readdirSync(dirPath).forEach(file => {
                const curPath = path.join(dirPath, file);
                if (fs.lstatSync(curPath).isDirectory()) {
                    this.deleteDirectoryRecursive(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(dirPath);
        }
    }

    /**
     * تسجيل أحداث النسخ الاحتياطية
     */
    logBackupEvent(type, message, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: type,
            message: message,
            data: data,
            user: process.env.USERNAME || 'system'
        };

        const logPath = './backup_service.log';
        fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
    }

    /**
     * بدء الخدمة المجدولة
     */
    startScheduledService() {
        console.log('⏰ بدء خدمة النسخ الاحتياطية المجدولة...');
        
        // نسخة احتياطية فورية
        this.createSmartBackup().then(() => {
            this.cleanupOldBackups();
        });

        // جدولة النسخ الدورية
        setInterval(async () => {
            console.log('🔄 بدء النسخ الاحتياطي المجدول...');
            await this.createSmartBackup();
            this.cleanupOldBackups();
        }, this.backupSchedule.interval);

        console.log(`✅ الخدمة مجدولة كل ${this.backupSchedule.interval / 1000 / 60 / 60} ساعة`);
        
        // الحفاظ على تشغيل العملية
        process.on('SIGINT', () => {
            console.log('\n🛑 إيقاف خدمة النسخ الاحتياطية...');
            this.logBackupEvent('SERVICE_STOPPED', 'تم إيقاف خدمة النسخ الاحتياطية');
            process.exit(0);
        });
    }

    /**
     * عرض حالة الخدمة
     */
    showServiceStatus() {
        console.log('📊 حالة خدمة النسخ الاحتياطية');
        console.log('='.repeat(40));
        
        // إحصائيات النسخ الاحتياطية
        if (fs.existsSync(this.backupDir)) {
            const backups = fs.readdirSync(this.backupDir);
            console.log(`📦 عدد النسخ الاحتياطية: ${backups.length}`);
            console.log(`🎯 الحد الأقصى للاحتفاظ: ${this.maxBackupsToKeep}`);
            
            if (backups.length > 0) {
                const latestBackup = backups
                    .map(name => ({
                        name: name,
                        created: fs.statSync(path.join(this.backupDir, name)).birthtime
                    }))
                    .sort((a, b) => b.created - a.created)[0];
                
                console.log(`⏰ آخر نسخة احتياطية: ${latestBackup.created.toLocaleString('ar-SA')}`);
            }
        } else {
            console.log('📦 لا توجد نسخ احتياطية بعد');
        }

        // إعدادات الجدولة
        console.log(`🔄 الفترة الزمنية: ${this.backupSchedule.interval / 1000 / 60 / 60} ساعة`);
        console.log(`📁 مجلد النسخ: ${this.backupDir}`);
    }
}

// تشغيل الخدمة
if (require.main === module) {
    const backupService = new AutomatedBackupService();
    
    const command = process.argv[2];
    
    switch(command) {
        case 'start':
            backupService.startScheduledService();
            break;
        case 'backup':
            backupService.createSmartBackup().then(() => {
                console.log('✅ تمت النسخة الاحتياطية');
                process.exit(0);
            });
            break;
        case 'cleanup':
            backupService.cleanupOldBackups();
            break;
        case 'status':
            backupService.showServiceStatus();
            break;
        default:
            console.log('\n🤖 خدمة النسخ الاحتياطية التلقائية');
            console.log('الاستخدام:');
            console.log('  node automated_backup_service.cjs start   - بدء الخدمة المجدولة');
            console.log('  node automated_backup_service.cjs backup  - نسخة احتياطية فورية');
            console.log('  node automated_backup_service.cjs cleanup - تنظيف النسخ القديمة');
            console.log('  node automated_backup_service.cjs status  - عرض حالة الخدمة');
    }
}

module.exports = AutomatedBackupService;