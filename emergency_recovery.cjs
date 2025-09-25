#!/usr/bin/env node
/**
 * نظام الاستعادة الطارئة - Emergency Recovery System
 * للاستعادة السريعة من النسخ الاحتياطية في حالات الطوارئ
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class EmergencyRecoverySystem {
    constructor() {
        this.backupDirectories = [
            './security_backups',
            './automated_backups', 
            './emergency_environment_backups',
            '.'
        ];
        
        this.criticalFiles = [
            'classroom.db',
            'classroom_dev.db',
            'classroom_test.db'
        ];
        
        this.configFiles = [
            '.env.development',
            '.env.production', 
            '.env.testing',
            'package.json',
            'tsconfig.json'
        ];
        
        this.initializeSystem();
    }

    /**
     * تهيئة نظام الاستعادة
     */
    initializeSystem() {
        console.log('🆘 نظام الاستعادة الطارئة جاهز');
        this.logRecoveryEvent('SYSTEM_INITIALIZED', 'تم تفعيل نظام الاستعادة الطارئة');
    }

    /**
     * البحث عن جميع النسخ الاحتياطية المتوفرة
     */
    findAvailableBackups() {
        console.log('🔍 البحث عن النسخ الاحتياطية المتوفرة...');
        
        const backups = [];
        
        for (const dir of this.backupDirectories) {
            if (fs.existsSync(dir)) {
                try {
                    const items = fs.readdirSync(dir);
                    
                    for (const item of items) {
                        const itemPath = path.join(dir, item);
                        const stats = fs.statSync(itemPath);
                        
                        if (stats.isDirectory() && (
                            item.includes('backup') || 
                            item.includes('comprehensive') || 
                            item.includes('auto_backup')
                        )) {
                            // فحص إذا كانت نسخة احتياطية صالحة
                            const backup = this.validateBackup(itemPath);
                            if (backup) {
                                backups.push({
                                    ...backup,
                                    path: itemPath,
                                    name: item,
                                    created: stats.birthtime,
                                    size: this.calculateDirectorySize(itemPath)
                                });
                            }
                        } else if (stats.isFile() && item.endsWith('.db') && item.includes('backup')) {
                            // نسخة احتياطية ملف مفرد
                            backups.push({
                                path: itemPath,
                                name: item,
                                type: 'single_file',
                                created: stats.birthtime,
                                size: stats.size,
                                valid: true
                            });
                        }
                    }
                } catch (error) {
                    console.log(`⚠️ خطأ في فحص مجلد ${dir}:`, error.message);
                }
            }
        }
        
        // ترتيب حسب التاريخ (الأحدث أولاً)
        backups.sort((a, b) => b.created - a.created);
        
        return backups;
    }

    /**
     * التحقق من صحة النسخة الاحتياطية
     */
    validateBackup(backupPath) {
        try {
            // فحص وجود تقرير النسخة الاحتياطية
            const reportPath = path.join(backupPath, 'backup_report.json');
            
            if (fs.existsSync(reportPath)) {
                const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
                
                // فحص وجود الملفات المهمة
                let hasDatabase = false;
                let hasConfig = false;
                
                if (report.files) {
                    for (const file of report.files) {
                        if (this.criticalFiles.some(cf => file.source.includes(cf))) {
                            hasDatabase = true;
                        }
                        if (this.configFiles.some(cf => file.source.includes(cf))) {
                            hasConfig = true;
                        }
                    }
                }
                
                return {
                    type: 'comprehensive',
                    valid: true,
                    hasDatabase: hasDatabase,
                    hasConfig: hasConfig,
                    report: report
                };
            } else {
                // فحص يدوي للملفات المهمة
                let hasDatabase = false;
                
                for (const dbFile of this.criticalFiles) {
                    if (fs.existsSync(path.join(backupPath, dbFile))) {
                        hasDatabase = true;
                        break;
                    }
                }
                
                return {
                    type: 'manual',
                    valid: hasDatabase,
                    hasDatabase: hasDatabase,
                    hasConfig: false
                };
            }
        } catch (error) {
            console.log(`⚠️ خطأ في التحقق من النسخة الاحتياطية ${backupPath}:`, error.message);
            return null;
        }
    }

    /**
     * حساب حجم المجلد
     */
    calculateDirectorySize(dirPath) {
        let totalSize = 0;
        
        try {
            const items = fs.readdirSync(dirPath);
            
            for (const item of items) {
                const itemPath = path.join(dirPath, item);
                const stats = fs.statSync(itemPath);
                
                if (stats.isDirectory()) {
                    totalSize += this.calculateDirectorySize(itemPath);
                } else {
                    totalSize += stats.size;
                }
            }
        } catch (error) {
            // تجاهل الأخطاء في حساب الحجم
        }
        
        return totalSize;
    }

    /**
     * عرض قائمة النسخ الاحتياطية المتوفرة
     */
    listAvailableBackups() {
        const backups = this.findAvailableBackups();
        
        if (backups.length === 0) {
            console.log('❌ لم يتم العثور على أي نسخ احتياطية!');
            console.log('💡 تأكد من وجود نسخ احتياطية في المجلدات التالية:');
            this.backupDirectories.forEach(dir => {
                console.log(`   - ${dir}`);
            });
            return [];
        }

        console.log(`\n📦 تم العثور على ${backups.length} نسخة احتياطية:`);
        console.log('='.repeat(80));
        
        backups.forEach((backup, index) => {
            const age = (Date.now() - backup.created.getTime()) / (1000 * 60 * 60); // ساعات
            const sizeStr = (backup.size / 1024 / 1024).toFixed(2);
            
            console.log(`${index + 1}. ${backup.name}`);
            console.log(`   📍 المسار: ${backup.path}`);
            console.log(`   📅 تاريخ الإنشاء: ${backup.created.toLocaleString('ar-SA')}`);
            console.log(`   ⏰ العمر: ${age.toFixed(1)} ساعة`);
            console.log(`   📊 الحجم: ${sizeStr} MB`);
            console.log(`   🗃️ قاعدة بيانات: ${backup.hasDatabase ? '✅' : '❌'}`);
            console.log(`   ⚙️ ملفات إعداد: ${backup.hasConfig ? '✅' : '❌'}`);
            console.log(`   ✅ صالحة: ${backup.valid ? '✅' : '❌'}`);
            console.log('   ' + '-'.repeat(70));
        });
        
        return backups;
    }

    /**
     * إيقاف جميع خدمات النظام
     */
    stopAllServices() {
        console.log('⏹️ إيقاف جميع خدمات النظام...');
        
        try {
            // إيقاف عمليات Node.js
            try {
                execSync('taskkill /IM node.exe /F', { stdio: 'pipe' });
                console.log('✅ تم إيقاف عمليات Node.js');
            } catch {
                console.log('ℹ️ لا توجد عمليات Node.js للإيقاف');
            }

            // إيقاف عمليات npm
            try {
                execSync('taskkill /IM npm.exe /F', { stdio: 'pipe' });
                console.log('✅ تم إيقاف عمليات npm');
            } catch {
                console.log('ℹ️ لا توجد عمليات npm للإيقاف');
            }

            // انتظار قصير للتأكد من إيقاف العمليات
            console.log('⏳ انتظار 3 ثواني للتأكد من إيقاف العمليات...');
            execSync('timeout /t 3 /nobreak', { stdio: 'pipe' });
            
            this.logRecoveryEvent('SERVICES_STOPPED', 'تم إيقاف جميع خدمات النظام');
            
        } catch (error) {
            console.log('⚠️ بعض الخدمات قد لا تكون متوقفة:', error.message);
        }
    }

    /**
     * استعادة من نسخة احتياطية محددة
     */
    async restoreFromBackup(backupPath, options = {}) {
        const {
            includeDatabase = true,
            includeConfig = true,
            createPreRestoreBackup = true,
            verify = true
        } = options;

        console.log(`🔄 بدء الاستعادة من: ${backupPath}`);
        
        try {
            // إنشاء نسخة احتياطية قبل الاستعادة
            if (createPreRestoreBackup) {
                await this.createPreRestoreBackup();
            }

            // إيقاف الخدمات
            this.stopAllServices();

            const backup = this.validateBackup(backupPath);
            
            if (!backup || !backup.valid) {
                throw new Error('النسخة الاحتياطية غير صالحة أو تالفة');
            }

            let restoredFiles = 0;

            // استعادة قواعد البيانات
            if (includeDatabase && backup.hasDatabase) {
                console.log('🗃️ استعادة قواعد البيانات...');
                
                for (const dbFile of this.criticalFiles) {
                    const backupDbPath = path.join(backupPath, dbFile);
                    
                    if (fs.existsSync(backupDbPath)) {
                        // إنشاء نسخة احتياطية من الملف الحالي إذا كان موجوداً
                        if (fs.existsSync(dbFile)) {
                            const backupCurrentPath = `${dbFile}.pre_restore_${Date.now()}`;
                            fs.copyFileSync(dbFile, backupCurrentPath);
                            console.log(`💾 تم حفظ نسخة من الملف الحالي: ${backupCurrentPath}`);
                        }
                        
                        // استعادة قاعدة البيانات
                        fs.copyFileSync(backupDbPath, dbFile);
                        console.log(`✅ تم استعادة: ${dbFile}`);
                        restoredFiles++;
                    }
                }
            }

            // استعادة ملفات الإعداد
            if (includeConfig && backup.hasConfig) {
                console.log('⚙️ استعادة ملفات الإعداد...');
                
                for (const configFile of this.configFiles) {
                    const backupConfigPath = path.join(backupPath, configFile);
                    
                    if (fs.existsSync(backupConfigPath)) {
                        // إنشاء نسخة احتياطية من ملف الإعداد الحالي
                        if (fs.existsSync(configFile)) {
                            const backupCurrentPath = `${configFile}.pre_restore_${Date.now()}`;
                            fs.copyFileSync(configFile, backupCurrentPath);
                            console.log(`💾 تم حفظ نسخة من الملف الحالي: ${backupCurrentPath}`);
                        }
                        
                        // استعادة ملف الإعداد
                        fs.copyFileSync(backupConfigPath, configFile);
                        console.log(`✅ تم استعادة: ${configFile}`);
                        restoredFiles++;
                    }
                }
            }

            if (restoredFiles === 0) {
                throw new Error('لم يتم استعادة أي ملفات');
            }

            // التحقق من سلامة الاستعادة
            if (verify) {
                const verificationResult = await this.verifyRestoration();
                if (!verificationResult.success) {
                    throw new Error('فشل في التحقق من سلامة الاستعادة: ' + verificationResult.error);
                }
            }

            this.logRecoveryEvent('RESTORE_COMPLETED', `تم استعادة ${restoredFiles} ملف من ${backupPath}`);
            
            console.log(`\n✅ تم استعادة ${restoredFiles} ملف بنجاح!`);
            console.log('🎉 الاستعادة مكتملة');
            
            return {
                success: true,
                restoredFiles: restoredFiles,
                backupPath: backupPath
            };

        } catch (error) {
            console.error('❌ فشلت الاستعادة:', error.message);
            
            this.logRecoveryEvent('RESTORE_FAILED', `فشلت الاستعادة من ${backupPath}: ${error.message}`);
            
            return {
                success: false,
                error: error.message,
                backupPath: backupPath
            };
        }
    }

    /**
     * استعادة تلقائية من آخر نسخة احتياطية
     */
    async autoRestore() {
        console.log('🤖 بدء الاستعادة التلقائية...');
        
        const backups = this.findAvailableBackups();
        
        if (backups.length === 0) {
            console.error('❌ لا توجد نسخ احتياطية للاستعادة منها!');
            return { success: false, error: 'لا توجد نسخ احتياطية' };
        }

        // البحث عن أفضل نسخة احتياطية (الأحدث والأكثر اكتمالاً)
        let bestBackup = null;
        
        for (const backup of backups) {
            if (backup.valid && backup.hasDatabase) {
                // أفضلية للنسخ الشاملة
                if (backup.hasConfig && backup.type === 'comprehensive') {
                    bestBackup = backup;
                    break;
                } else if (!bestBackup) {
                    bestBackup = backup;
                }
            }
        }

        if (!bestBackup) {
            console.error('❌ لم يتم العثور على نسخة احتياطية صالحة!');
            return { success: false, error: 'لا توجد نسخة احتياطية صالحة' };
        }

        console.log(`🎯 تم اختيار النسخة الاحتياطية: ${bestBackup.name}`);
        console.log(`📅 تاريخ الإنشاء: ${bestBackup.created.toLocaleString('ar-SA')}`);
        
        // تنفيذ الاستعادة
        return await this.restoreFromBackup(bestBackup.path, {
            includeDatabase: true,
            includeConfig: bestBackup.hasConfig,
            createPreRestoreBackup: true,
            verify: true
        });
    }

    /**
     * إنشاء نسخة احتياطية قبل الاستعادة
     */
    async createPreRestoreBackup() {
        console.log('💾 إنشاء نسخة احتياطية قبل الاستعادة...');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const preRestoreDir = `./pre_restore_backup_${timestamp}`;
        
        try {
            fs.mkdirSync(preRestoreDir, { recursive: true });
            
            // نسخ الملفات الحالية
            for (const file of [...this.criticalFiles, ...this.configFiles]) {
                if (fs.existsSync(file)) {
                    const destPath = path.join(preRestoreDir, file);
                    const destDir = path.dirname(destPath);
                    
                    if (!fs.existsSync(destDir)) {
                        fs.mkdirSync(destDir, { recursive: true });
                    }
                    
                    fs.copyFileSync(file, destPath);
                }
            }
            
            console.log(`✅ تم إنشاء نسخة احتياطية قبل الاستعادة: ${preRestoreDir}`);
            
        } catch (error) {
            console.log('⚠️ خطأ في إنشاء نسخة احتياطية قبل الاستعادة:', error.message);
        }
    }

    /**
     * التحقق من سلامة الاستعادة
     */
    async verifyRestoration() {
        console.log('🔍 التحقق من سلامة الاستعادة...');
        
        try {
            // فحص وجود قواعد البيانات الأساسية
            let dbCount = 0;
            for (const dbFile of this.criticalFiles) {
                if (fs.existsSync(dbFile)) {
                    const stats = fs.statSync(dbFile);
                    if (stats.size > 0) {
                        dbCount++;
                        console.log(`✅ ${dbFile} موجود (${(stats.size / 1024).toFixed(2)} KB)`);
                    } else {
                        console.log(`⚠️ ${dbFile} فارغ`);
                    }
                } else {
                    console.log(`❌ ${dbFile} غير موجود`);
                }
            }

            if (dbCount === 0) {
                return {
                    success: false,
                    error: 'لم يتم العثور على أي قاعدة بيانات صالحة'
                };
            }

            // فحص ملفات الإعداد الأساسية
            let configCount = 0;
            for (const configFile of this.configFiles) {
                if (fs.existsSync(configFile)) {
                    configCount++;
                    console.log(`✅ ${configFile} موجود`);
                }
            }

            console.log(`📊 ملخص التحقق:`);
            console.log(`   🗃️ قواعد البيانات: ${dbCount}/${this.criticalFiles.length}`);
            console.log(`   ⚙️ ملفات الإعداد: ${configCount}/${this.configFiles.length}`);

            return {
                success: true,
                databaseCount: dbCount,
                configCount: configCount
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * تسجيل أحداث الاستعادة
     */
    logRecoveryEvent(type, message, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: type,
            message: message,
            data: data,
            user: process.env.USERNAME || 'system'
        };

        const logPath = './recovery_audit.log';
        fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
    }
}

// تشغيل النظام
if (require.main === module) {
    const recovery = new EmergencyRecoverySystem();
    
    const command = process.argv[2];
    const option = process.argv[3];
    
    switch(command) {
        case 'list-backups':
            recovery.listAvailableBackups();
            break;
            
        case 'auto-restore':
            recovery.autoRestore().then(result => {
                if (result.success) {
                    console.log('\n🎉 الاستعادة التلقائية مكتملة!');
                    process.exit(0);
                } else {
                    console.error('\n❌ فشلت الاستعادة التلقائية:', result.error);
                    process.exit(1);
                }
            });
            break;
            
        case 'restore-latest':
            const backups = recovery.findAvailableBackups();
            if (backups.length > 0) {
                recovery.restoreFromBackup(backups[0].path, { verify: option === '--verify' })
                    .then(result => {
                        process.exit(result.success ? 0 : 1);
                    });
            } else {
                console.error('❌ لا توجد نسخ احتياطية');
                process.exit(1);
            }
            break;
            
        case 'verify-restore':
            recovery.verifyRestoration().then(result => {
                if (result.success) {
                    console.log('✅ الاستعادة صحيحة');
                    process.exit(0);
                } else {
                    console.error('❌ مشكلة في الاستعادة:', result.error);
                    process.exit(1);
                }
            });
            break;
            
        case 'stop-services':
            recovery.stopAllServices();
            break;
            
        default:
            console.log('\n🆘 نظام الاستعادة الطارئة');
            console.log('الاستخدام:');
            console.log('  node emergency_recovery.cjs list-backups    - عرض النسخ الاحتياطية المتوفرة');
            console.log('  node emergency_recovery.cjs auto-restore    - استعادة تلقائية من آخر نسخة احتياطية');
            console.log('  node emergency_recovery.cjs restore-latest  - استعادة من آخر نسخة احتياطية');
            console.log('  node emergency_recovery.cjs verify-restore  - التحقق من سلامة الاستعادة');
            console.log('  node emergency_recovery.cjs stop-services   - إيقاف جميع الخدمات');
            console.log('\nخيارات إضافية:');
            console.log('  --verify                                    - التحقق من الاستعادة تلقائياً');
    }
}

module.exports = EmergencyRecoverySystem;