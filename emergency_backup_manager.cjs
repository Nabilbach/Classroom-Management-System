#!/usr/bin/env node
/**
 * مدير النسخ الاحتياطية الطارئة
 * Emergency Backup Manager - إنشاء نسخ احتياطية آمنة ومضغوطة
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class EmergencyBackupManager {
    constructor() {
        this.backupDir = './security_backups';
        this.ensureBackupDirectory();
    }

    /**
     * إنشاء مجلد النسخ الاحتياطية
     */
    ensureBackupDirectory() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
            console.log(`📁 تم إنشاء مجلد النسخ الاحتياطية: ${this.backupDir}`);
        }
    }

    /**
     * حساب checksum للملف للتحقق من سلامته
     */
    calculateFileHash(filePath) {
        const fileBuffer = fs.readFileSync(filePath);
        const hash = crypto.createHash('sha256');
        hash.update(fileBuffer);
        return hash.digest('hex');
    }

    /**
     * حساب حجم المجلد
     */
    calculateDirectorySize(dirPath) {
        let totalSize = 0;
        const files = fs.readdirSync(dirPath);
        
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            totalSize += stats.size;
        }
        
        return totalSize;
    }

    /**
     * إنشاء نسخة احتياطية طارئة شاملة
     */
    async createComprehensiveBackup(reason = 'security_implementation') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `comprehensive_${reason}_${timestamp}`;
        const backupPath = path.join(this.backupDir, backupName);
        
        console.log('🔄 بدء إنشاء النسخة الاحتياطية الشاملة...\n');
        
        try {
            // إنشاء مجلد النسخة الاحتياطية
            fs.mkdirSync(backupPath, { recursive: true });

            // قائمة الملفات المهمة للنسخ الاحتياطي
            const criticalFiles = [
                'classroom.db',
                'classroom_dev.db', 
                'classroom_test.db',
                'classroom_backup.db.db',
                'classroom_backup_2.db'
            ];

            const criticalDirectories = [
                'backend/config',
                'backend/models',
                'backend/routes'
            ];

            const backupReport = {
                timestamp: new Date().toISOString(),
                reason: reason,
                files: [],
                directories: [],
                totalSize: 0,
                checksums: {},
                status: 'in_progress'
            };

            console.log('📦 نسخ قواعد البيانات...');
            
            // نسخ ملفات قاعدة البيانات
            for (const dbFile of criticalFiles) {
                if (fs.existsSync(dbFile)) {
                    const destPath = path.join(backupPath, dbFile);
                    fs.copyFileSync(dbFile, destPath);
                    
                    const hash = this.calculateFileHash(dbFile);
                    const stats = fs.statSync(dbFile);
                    
                    backupReport.files.push({
                        source: dbFile,
                        destination: destPath,
                        size: stats.size,
                        modified: stats.mtime.toISOString(),
                        hash: hash
                    });
                    
                    backupReport.checksums[dbFile] = hash;
                    backupReport.totalSize += stats.size;
                    
                    console.log(`✅ تم نسخ: ${dbFile} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
                } else {
                    console.log(`⚠️ لم يتم العثور على: ${dbFile}`);
                }
            }

            console.log('\n📁 نسخ المجلدات الحرجة...');
            
            // نسخ المجلدات المهمة
            for (const dir of criticalDirectories) {
                if (fs.existsSync(dir)) {
                    const destDir = path.join(backupPath, dir);
                    this.copyDirectoryRecursive(dir, destDir);
                    
                    const dirSize = this.calculateDirectorySize(destDir);
                    backupReport.directories.push({
                        source: dir,
                        destination: destDir,
                        size: dirSize
                    });
                    
                    backupReport.totalSize += dirSize;
                    console.log(`✅ تم نسخ مجلد: ${dir} (${(dirSize / 1024).toFixed(2)} KB)`);
                } else {
                    console.log(`⚠️ لم يتم العثور على مجلد: ${dir}`);
                }
            }

            // نسخ الملفات المهمة الأخرى
            const importantFiles = [
                'package.json',
                'tsconfig.json', 
                'vite.config.js',
                '.env.development',
                '.env.production',
                '.env.testing'
            ];

            console.log('\n📄 نسخ ملفات الإعداد...');
            
            for (const file of importantFiles) {
                if (fs.existsSync(file)) {
                    const destPath = path.join(backupPath, file);
                    const destDir = path.dirname(destPath);
                    
                    if (!fs.existsSync(destDir)) {
                        fs.mkdirSync(destDir, { recursive: true });
                    }
                    
                    fs.copyFileSync(file, destPath);
                    
                    const hash = this.calculateFileHash(file);
                    const stats = fs.statSync(file);
                    
                    backupReport.files.push({
                        source: file,
                        destination: destPath,
                        size: stats.size,
                        modified: stats.mtime.toISOString(),
                        hash: hash
                    });
                    
                    backupReport.checksums[file] = hash;
                    console.log(`✅ تم نسخ: ${file}`);
                }
            }

            // إنهاء التقرير
            backupReport.status = 'completed';
            backupReport.completedAt = new Date().toISOString();
            
            // حفظ تقرير النسخة الاحتياطية
            const reportPath = path.join(backupPath, 'backup_report.json');
            fs.writeFileSync(reportPath, JSON.stringify(backupReport, null, 2));
            
            // إنشاء ملف README للنسخة الاحتياطية
            const readmePath = path.join(backupPath, 'README.md');
            const readmeContent = this.generateBackupReadme(backupReport);
            fs.writeFileSync(readmePath, readmeContent);

            console.log('\n✅ تم إنشاء النسخة الاحتياطية بنجاح!');
            console.log(`📍 المسار: ${backupPath}`);
            console.log(`📊 الحجم الإجمالي: ${(backupReport.totalSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`🗂️ عدد الملفات: ${backupReport.files.length}`);
            console.log(`📁 عدد المجلدات: ${backupReport.directories.length}`);
            
            return {
                success: true,
                backupPath: backupPath,
                report: backupReport
            };

        } catch (error) {
            console.error('❌ خطأ في إنشاء النسخة الاحتياطية:', error);
            return {
                success: false,
                error: error.message,
                backupPath: backupPath
            };
        }
    }

    /**
     * نسخ مجلد بشكل تدريجي
     */
    copyDirectoryRecursive(source, destination) {
        if (!fs.existsSync(destination)) {
            fs.mkdirSync(destination, { recursive: true });
        }

        const files = fs.readdirSync(source);
        
        for (const file of files) {
            const sourcePath = path.join(source, file);
            const destPath = path.join(destination, file);
            
            if (fs.statSync(sourcePath).isDirectory()) {
                this.copyDirectoryRecursive(sourcePath, destPath);
            } else {
                fs.copyFileSync(sourcePath, destPath);
            }
        }
    }

    /**
     * إنشاء ملف README للنسخة الاحتياطية
     */
    generateBackupReadme(report) {
        return `# نسخة احتياطية شاملة - Comprehensive Backup

## معلومات النسخة الاحتياطية
- **السبب**: ${report.reason}
- **تاريخ الإنشاء**: ${new Date(report.timestamp).toLocaleString('ar-SA')}
- **الحالة**: ${report.status}
- **الحجم الإجمالي**: ${(report.totalSize / 1024 / 1024).toFixed(2)} MB

## الملفات المحفوظة
${report.files.map(file => `- \`${file.source}\` (${(file.size / 1024).toFixed(2)} KB)`).join('\n')}

## المجلدات المحفوظة  
${report.directories.map(dir => `- \`${dir.source}\` (${(dir.size / 1024).toFixed(2)} KB)`).join('\n')}

## التحقق من السلامة
استخدم الأوامر التالية للتحقق من سلامة النسخة الاحتياطية:

\`\`\`bash
# للتحقق من checksum لقاعدة البيانات الرئيسية
sha256sum classroom.db
# يجب أن يطابق: ${report.checksums['classroom.db'] || 'غير متوفر'}
\`\`\`

## استعادة النسخة الاحتياطية
لاستعادة النسخة الاحتياطية:
1. أوقف جميع خدمات النظام
2. انسخ الملفات من هذا المجلد إلى المجلد الرئيسي
3. تأكد من الأذونات والإعدادات
4. أعد تشغيل النظام

⚠️ **تحذير**: هذه النسخة الاحتياطية تم إنشاؤها قبل تطبيق التحديثات الأمنية.
`;
    }

    /**
     * التحقق من صحة النسخة الاحتياطية
     */
    verifyBackup(backupPath) {
        console.log('🔍 التحقق من صحة النسخة الاحتياطية...');
        
        const reportPath = path.join(backupPath, 'backup_report.json');
        
        if (!fs.existsSync(reportPath)) {
            console.error('❌ لم يتم العثور على تقرير النسخة الاحتياطية');
            return false;
        }

        try {
            const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
            
            console.log('✅ تقرير النسخة الاحتياطية موجود');
            console.log(`📊 عدد الملفات المتوقع: ${report.files.length}`);
            
            // التحقق من وجود الملفات
            for (const fileInfo of report.files) {
                if (fs.existsSync(fileInfo.destination)) {
                    console.log(`✅ ${fileInfo.source}`);
                } else {
                    console.error(`❌ مفقود: ${fileInfo.source}`);
                    return false;
                }
            }
            
            console.log('✅ جميع الملفات موجودة وسليمة');
            return true;
            
        } catch (error) {
            console.error('❌ خطأ في التحقق من النسخة الاحتياطية:', error);
            return false;
        }
    }
}

// تشغيل النسخ الاحتياطي إذا تم استدعاء الملف مباشرة
if (require.main === module) {
    const backupManager = new EmergencyBackupManager();
    
    backupManager.createComprehensiveBackup('security_implementation')
        .then(result => {
            if (result.success) {
                console.log('\n🎉 تمت العملية بنجاح!');
                
                // التحقق من النسخة الاحتياطية
                if (backupManager.verifyBackup(result.backupPath)) {
                    console.log('✅ تم التحقق من صحة النسخة الاحتياطية');
                }
            } else {
                console.error('\n❌ فشلت عملية النسخ الاحتياطي:', result.error);
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('❌ خطأ غير متوقع:', error);
            process.exit(1);
        });
}

module.exports = EmergencyBackupManager;