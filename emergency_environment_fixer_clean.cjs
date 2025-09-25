const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

/**
 * حل عاجل لمشكلة تداخل البيئات وحماية بيانات الإنتاج
 * Emergency Solution for Environment Conflicts and Production Data Protection
 */

class EmergencyEnvironmentFixer {
    constructor() {
        this.rootPath = process.cwd();
        this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.backupDir = 'emergency_environment_backups';
        this.actions = [];
        
        // إنشاء مجلد الطوارئ
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    // الخطوة 1: إنشاء نسخ احتياطية طوارئ متعددة
    async createEmergencyBackups() {
        console.log('🚨 إنشاء نسخ احتياطية طوارئ...\n');

        const productionDb = 'classroom.db';
        
        if (!fs.existsSync(productionDb)) {
            throw new Error('❌ قاعدة بيانات الإنتاج غير موجودة!');
        }

        const backups = [
            this.backupDir + '/classroom_emergency_' + this.timestamp + '.db',
            this.backupDir + '/classroom_production_stable.db',
            this.backupDir + '/classroom_pre_fix_' + this.timestamp + '.db'
        ];

        for (const backup of backups) {
            try {
                fs.copyFileSync(productionDb, backup);
                const stats = fs.statSync(backup);
                console.log('✅ تم إنشاء: ' + backup);
                console.log('   📏 الحجم: ' + (stats.size / 1024).toFixed(1) + ' KB\n');
                
                this.actions.push({
                    action: 'backup_created',
                    file: backup,
                    size: stats.size,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('❌ فشل في إنشاء ' + backup + ':', error.message);
            }
        }
    }

    // الخطوة 2: إصلاح بيئة التطوير
    async fixDevelopmentEnvironment() {
        console.log('🔧 إصلاح بيئة التطوير...\n');

        const productionDb = 'classroom.db';
        const devDb = 'classroom_dev.db';
        
        // نسخ قاعدة الإنتاج لبيئة التطوير
        console.log('📋 نسخ بيانات الإنتاج لبيئة التطوير...');
        fs.copyFileSync(productionDb, devDb);
        
        // تنظيف البيانات الحساسة في بيئة التطوير
        await this.sanitizeDevelopmentData(devDb);
        
        console.log('✅ تم إصلاح بيئة التطوير بنجاح\n');
        
        this.actions.push({
            action: 'dev_environment_fixed',
            source: productionDb,
            target: devDb,
            timestamp: new Date().toISOString()
        });
    }

    // تنظيف البيانات الحساسة في بيئة التطوير
    async sanitizeDevelopmentData(devDbPath) {
        return new Promise((resolve, reject) => {
            console.log('🧹 تنظيف البيانات الحساسة في بيئة التطوير...');
            
            const db = new sqlite3.Database(devDbPath, (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                const sanitizeQueries = [
                    // تقليل سجلات الحضور (الاحتفاظ بالأحدث فقط)
                    "DELETE FROM Attendances WHERE date < date('now', '-7 days')",
                    
                    // تنظيف بيانات التقييمات القديمة
                    "DELETE FROM StudentAssessments WHERE createdAt < date('now', '-30 days')",
                    
                    // الاحتفاظ بـ 50 طالب فقط للاختبار
                    "DELETE FROM Students WHERE id NOT IN (SELECT id FROM Students LIMIT 50)",
                    
                    // تنظيف سجلات الحضور المرتبطة بالطلاب المحذوفين
                    "DELETE FROM Attendances WHERE studentId NOT IN (SELECT id FROM Students)",
                    
                    // إضافة علامة بيئة التطوير
                    "INSERT OR REPLACE INTO audit_log (action_type, table_name, description, timestamp) VALUES ('DEV_ENVIRONMENT_SETUP', 'system', 'Development environment sanitized', datetime('now'))"
                ];

                let completedQueries = 0;
                const totalQueries = sanitizeQueries.length;

                sanitizeQueries.forEach((query, index) => {
                    db.run(query, (err) => {
                        completedQueries++;
                        
                        if (err) {
                            console.warn('⚠️ تحذير في الاستعلام ' + (index + 1) + ':', err.message);
                        } else {
                            console.log('   ✅ تم تنفيذ التنظيف ' + (index + 1) + '/' + totalQueries);
                        }

                        if (completedQueries === totalQueries) {
                            db.close();
                            console.log('🎯 تم تنظيف بيئة التطوير بنجاح');
                            resolve();
                        }
                    });
                });
            });
        });
    }

    // الخطوة 3: إعداد فصل المنافذ
    async setupPortSeparation() {
        console.log('🔌 إعداد فصل المنافذ...\n');

        const envConfigs = {
            '.env.production': {
                NODE_ENV: 'production',
                PORT: '3000',
                DB_PATH: 'classroom.db',
                APP_NAME: '"Classroom Management System - Production"',
                VITE_API_URL: 'http://localhost:3000',
                VITE_APP_ENV: 'production'
            },
            '.env.development': {
                NODE_ENV: 'development', 
                PORT: '3001',
                DB_PATH: 'classroom_dev.db',
                APP_NAME: '"Classroom Management System - Development"',
                VITE_API_URL: 'http://localhost:3001',
                VITE_APP_ENV: 'development'
            },
            '.env.testing': {
                NODE_ENV: 'testing',
                PORT: '3002', 
                DB_PATH: 'classroom_test.db',
                APP_NAME: '"Classroom Management System - Testing"',
                VITE_API_URL: 'http://localhost:3002',
                VITE_APP_ENV: 'testing'
            }
        };

        Object.entries(envConfigs).forEach(([filename, config]) => {
            const content = Object.entries(config)
                .map(([key, value]) => key + '=' + value)
                .join('\n') + '\n';

            try {
                fs.writeFileSync(filename, content);
                console.log('✅ تم إنشاء: ' + filename);
                console.log('   🔌 المنفذ: ' + config.PORT);
                console.log('   🗃️ قاعدة البيانات: ' + config.DB_PATH + '\n');
                
                this.actions.push({
                    action: 'env_config_created',
                    file: filename,
                    port: config.PORT,
                    database: config.DB_PATH,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('❌ فشل في إنشاء ' + filename + ':', error.message);
            }
        });
    }

    // الخطوة 4: إنشاء سكريبتات تشغيل منفصلة
    async createSeparateStartScripts() {
        console.log('📜 إنشاء سكريبتات تشغيل منفصلة...\n');

        const scripts = {
            'start-production.bat': {
                env: '.env.production',
                port: '3000',
                db: 'classroom.db',
                content: '@echo off\ntitle Classroom Management System - PRODUCTION\necho ======================================\necho  PRODUCTION ENVIRONMENT - PORT 3000\necho  DATABASE: classroom.db\necho ======================================\necho.\necho Starting PRODUCTION backend...\ncd backend\nset NODE_ENV=production\nset PORT=3000\nset DB_PATH=classroom.db\nnode index.js\npause'
            },
            'start-development.bat': {
                env: '.env.development', 
                port: '3001',
                db: 'classroom_dev.db',
                content: '@echo off\ntitle Classroom Management System - DEVELOPMENT\necho ======================================\necho  DEVELOPMENT ENVIRONMENT - PORT 3001\necho  DATABASE: classroom_dev.db\necho ======================================\necho.\necho Starting DEVELOPMENT backend...\ncd backend\nset NODE_ENV=development\nset PORT=3001\nset DB_PATH=classroom_dev.db\nnode index.js\npause'
            },
            'start-testing.bat': {
                env: '.env.testing',
                port: '3002', 
                db: 'classroom_test.db',
                content: '@echo off\ntitle Classroom Management System - TESTING\necho ======================================\necho  TESTING ENVIRONMENT - PORT 3002\necho  DATABASE: classroom_test.db\necho ======================================\necho.\necho Starting TESTING backend...\ncd backend\nset NODE_ENV=testing\nset PORT=3002\nset DB_PATH=classroom_test.db\nnode index.js\npause'
            }
        };

        Object.entries(scripts).forEach(([filename, script]) => {
            try {
                fs.writeFileSync(filename, script.content);
                console.log('✅ تم إنشاء: ' + filename);
                console.log('   🎯 البيئة: ' + script.env);
                console.log('   🔌 المنفذ: ' + script.port);
                console.log('   🗃️ قاعدة البيانات: ' + script.db + '\n');
                
                this.actions.push({
                    action: 'start_script_created',
                    file: filename,
                    environment: script.env,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('❌ فشل في إنشاء ' + filename + ':', error.message);
            }
        });
    }

    // تشغيل الإصلاح الشامل
    async runEmergencyFix() {
        console.log('🚨 بدء الإصلاح العاجل لمشكلة تداخل البيئات');
        console.log('='.repeat(80));
        
        try {
            // الخطوة 1: النسخ الاحتياطية
            await this.createEmergencyBackups();
            
            // الخطوة 2: إصلاح بيئة التطوير
            await this.fixDevelopmentEnvironment();
            
            // الخطوة 3: فصل المنافذ
            await this.setupPortSeparation();
            
            // الخطوة 4: سكريبتات التشغيل
            await this.createSeparateStartScripts();
            
            // تقرير نهائي
            await this.generateFixReport();
            
            console.log('\n🎉 تم إكمال الإصلاح العاجل بنجاح!');
            
        } catch (error) {
            console.error('❌ خطأ في الإصلاح العاجل:', error);
            throw error;
        }
    }

    // إنشاء تقرير الإصلاح
    async generateFixReport() {
        const report = {
            timestamp: new Date().toISOString(),
            status: 'COMPLETED',
            actions: this.actions,
            summary: {
                backupsCreated: this.actions.filter(a => a.action === 'backup_created').length,
                environmentsFixed: this.actions.filter(a => a.action === 'dev_environment_fixed').length,
                configsCreated: this.actions.filter(a => a.action === 'env_config_created').length,
                scriptsCreated: this.actions.filter(a => a.action === 'start_script_created').length
            },
            nextSteps: [
                'اختبار سكريبتات التشغيل الجديدة',
                'التأكد من عمل كل بيئة على منفذ منفصل',
                'مراجعة بيانات بيئة التطوير المُنظفة',
                'بدء استخدام البيئات المنفصلة للتطوير'
            ]
        };

        const reportPath = this.backupDir + '/emergency_fix_report_' + this.timestamp + '.json';
        
        try {
            fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
            
            console.log('\n' + '='.repeat(80));
            console.log('📋 تقرير الإصلاح العاجل');
            console.log('='.repeat(80));
            console.log('💾 النسخ الاحتياطية: ' + report.summary.backupsCreated);
            console.log('🔧 البيئات المُصلحة: ' + report.summary.environmentsFixed);
            console.log('📄 ملفات التكوين: ' + report.summary.configsCreated);
            console.log('📜 سكريبتات التشغيل: ' + report.summary.scriptsCreated);
            
            console.log('\n💡 الخطوات التالية:');
            report.nextSteps.forEach((step, index) => {
                console.log('   ' + (index + 1) + '. ' + step);
            });
            
            console.log('\n📄 تقرير مُفصل: ' + reportPath);
            
        } catch (error) {
            console.error('❌ فشل في حفظ التقرير:', error.message);
        }
    }
}

// تشغيل الإصلاح إذا تم استدعاء الملف مباشرة
if (require.main === module) {
    const fixer = new EmergencyEnvironmentFixer();
    fixer.runEmergencyFix()
        .then(() => {
            console.log('\n✅ تم إكمال الإصلاح العاجل للبيئات');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ فشل الإصلاح العاجل:', error);
            process.exit(1);
        });
}

module.exports = EmergencyEnvironmentFixer;