const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

/**
 * تحليل شامل لبيئات التطبيق المختلفة وتأثيرها على البيانات
 * Comprehensive Analysis of Application Environments and Their Impact on Data
 */

class EnvironmentAnalyzer {
    constructor() {
        this.rootPath = process.cwd();
        this.environments = {};
        this.potentialDatabases = [];
        this.configFiles = [];
        this.findings = {
            environmentCount: 0,
            databaseConflicts: [],
            configInconsistencies: [],
            dataDiscrepancies: [],
            recommendations: []
        };
    }

    // فحص جميع قواعد البيانات الموجودة
    async scanForDatabases() {
        console.log('🔍 فحص قواعد البيانات الموجودة...\n');
        
        const dbFiles = [
            'classroom.db',           // الإنتاج الرئيسية
            'classroom_dev.db',       // التطوير
            'classroom_test.db',      // الاختبار
            'classroom.db.db',        // نسخة محتملة
            'classroom_backup.db',    // نسخة احتياطية
            'classroom_backup_2.db', // نسخة احتياطية أخرى
        ];

        for (const dbFile of dbFiles) {
            const dbPath = path.join(this.rootPath, dbFile);
            if (fs.existsSync(dbPath)) {
                const stats = fs.statSync(dbPath);
                const dbInfo = {
                    name: dbFile,
                    path: dbPath,
                    size: stats.size,
                    modified: stats.mtime,
                    environment: this.determineEnvironment(dbFile),
                    tableCount: 0,
                    recordCounts: {}
                };

                try {
                    await this.analyzeDatabase(dbInfo);
                    this.potentialDatabases.push(dbInfo);
                } catch (error) {
                    console.error(`❌ خطأ في تحليل ${dbFile}:`, error.message);
                }
            }
        }

        // فحص مجلدات النسخ الاحتياطية
        const backupDirs = ['auto_backups', 'backups', 'db_backups'];
        for (const dir of backupDirs) {
            const dirPath = path.join(this.rootPath, dir);
            if (fs.existsSync(dirPath)) {
                const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.db'));
                console.log(`📁 مجلد ${dir}: ${files.length} ملف قاعدة بيانات`);
            }
        }
    }

    // تحديد البيئة حسب اسم الملف
    determineEnvironment(filename) {
        if (filename.includes('dev') || filename.includes('development')) return 'development';
        if (filename.includes('test') || filename.includes('testing')) return 'testing';
        if (filename.includes('prod') || filename.includes('production')) return 'production';
        if (filename.includes('backup')) return 'backup';
        if (filename === 'classroom.db') return 'production'; // افتراضي
        return 'unknown';
    }

    // تحليل قاعدة بيانات واحدة
    async analyzeDatabase(dbInfo) {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(dbInfo.path, sqlite3.OPEN_READONLY, (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                // فحص الجداول الموجودة
                db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    dbInfo.tableCount = tables.length;
                    dbInfo.tables = tables.map(t => t.name);

                    console.log(`📊 ${dbInfo.name} (${dbInfo.environment}):`);
                    console.log(`   📁 الحجم: ${(dbInfo.size / 1024).toFixed(1)} KB`);
                    console.log(`   📅 آخر تعديل: ${dbInfo.modified.toLocaleString('ar-SA')}`);
                    console.log(`   📋 عدد الجداول: ${dbInfo.tableCount}`);

                    // فحص عدد السجلات في الجداول المهمة
                    const criticalTables = [
                        'LessonTemplates', 'ScheduledLessons', 'TextbookEntries', 
                        'Students', 'Sections', 'Attendances', 'AdminScheduleEntries'
                    ];

                    let completedQueries = 0;
                    const totalQueries = criticalTables.length;

                    criticalTables.forEach(tableName => {
                        if (dbInfo.tables.includes(tableName)) {
                            db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, result) => {
                                completedQueries++;
                                if (!err && result) {
                                    dbInfo.recordCounts[tableName] = result.count;
                                    console.log(`      ${tableName}: ${result.count} سجل`);
                                } else {
                                    console.log(`      ${tableName}: خطأ في القراءة`);
                                }

                                if (completedQueries === totalQueries) {
                                    db.close();
                                    resolve(dbInfo);
                                }
                            });
                        } else {
                            completedQueries++;
                            console.log(`      ${tableName}: غير موجود`);
                            if (completedQueries === totalQueries) {
                                db.close();
                                resolve(dbInfo);
                            }
                        }
                    });

                    if (totalQueries === 0) {
                        db.close();
                        resolve(dbInfo);
                    }
                });
            });
        });
    }

    // فحص ملفات التكوين
    async scanConfigFiles() {
        console.log('\n🔧 فحص ملفات التكوين...\n');

        const configFiles = [
            '.env',
            '.env.development', 
            '.env.production',
            '.env.local',
            'backend/.env',
            'backend/.env.development',
            'backend/.env.production',
            'backend/config/config.json',
            'backend/config/database.js',
            'config/database.js'
        ];

        for (const configFile of configFiles) {
            const configPath = path.join(this.rootPath, configFile);
            if (fs.existsSync(configPath)) {
                try {
                    const content = fs.readFileSync(configPath, 'utf8');
                    const configInfo = {
                        name: configFile,
                        path: configPath,
                        content: content,
                        databaseRefs: this.extractDatabaseReferences(content),
                        environment: this.determineConfigEnvironment(configFile)
                    };
                    
                    this.configFiles.push(configInfo);
                    console.log(`📄 ${configFile}:`);
                    console.log(`   🎯 البيئة: ${configInfo.environment}`);
                    if (configInfo.databaseRefs.length > 0) {
                        console.log(`   🗃️ مراجع قواعد البيانات:`);
                        configInfo.databaseRefs.forEach(ref => {
                            console.log(`      - ${ref}`);
                        });
                    }
                } catch (error) {
                    console.error(`❌ خطأ في قراءة ${configFile}:`, error.message);
                }
            }
        }
    }

    // استخراج مراجع قواعد البيانات من ملفات التكوين
    extractDatabaseReferences(content) {
        const refs = [];
        const patterns = [
            /DATABASE_URL=(.+)/g,
            /DB_PATH=(.+)/g,
            /SQLITE_PATH=(.+)/g,
            /database.*['":].*\.db/g,
            /classroom.*\.db/g
        ];

        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                refs.push(match[0]);
            }
        });

        return refs;
    }

    // تحديد بيئة ملف التكوين
    determineConfigEnvironment(filename) {
        if (filename.includes('development')) return 'development';
        if (filename.includes('production')) return 'production';
        if (filename.includes('test')) return 'testing';
        if (filename === '.env') return 'default';
        return 'unknown';
    }

    // تحليل التداخل بين البيئات
    async analyzeEnvironmentConflicts() {
        console.log('\n⚠️ تحليل التداخل والتضارب بين البيئات...\n');

        // تجميع البيئات
        const envGroups = {};
        this.potentialDatabases.forEach(db => {
            if (!envGroups[db.environment]) {
                envGroups[db.environment] = [];
            }
            envGroups[db.environment].push(db);
        });

        // فحص التضارب
        Object.entries(envGroups).forEach(([env, databases]) => {
            console.log(`🏷️ بيئة ${env}:`);
            databases.forEach(db => {
                console.log(`   📊 ${db.name} - ${db.tableCount} جدول`);
                
                // مقارنة عدد السجلات
                Object.entries(db.recordCounts).forEach(([table, count]) => {
                    console.log(`      ${table}: ${count}`);
                });
            });

            // البحث عن تضارب في نفس البيئة
            if (databases.length > 1) {
                console.log(`   ⚠️ تحذير: عدة قواعد بيانات في نفس البيئة!`);
                this.findings.databaseConflicts.push({
                    environment: env,
                    databases: databases.map(db => db.name)
                });
            }
        });

        // مقارنة البيانات بين البيئات المختلفة
        await this.compareDataAcrossEnvironments(envGroups);
    }

    // مقارنة البيانات عبر البيئات المختلفة
    async compareDataAcrossEnvironments(envGroups) {
        console.log('\n📊 مقارنة البيانات عبر البيئات...\n');

        const criticalTables = ['LessonTemplates', 'ScheduledLessons', 'TextbookEntries', 'Students'];
        
        criticalTables.forEach(tableName => {
            console.log(`📋 مقارنة جدول ${tableName}:`);
            
            let maxCount = 0;
            let minCount = Infinity;
            let envCounts = {};

            Object.entries(envGroups).forEach(([env, databases]) => {
                databases.forEach(db => {
                    const count = db.recordCounts[tableName] || 0;
                    envCounts[`${env}(${db.name})`] = count;
                    maxCount = Math.max(maxCount, count);
                    minCount = Math.min(minCount, count);
                });
            });

            Object.entries(envCounts).forEach(([env, count]) => {
                const status = count === maxCount ? '🟢' : count === minCount ? '🔴' : '🟡';
                console.log(`   ${status} ${env}: ${count} سجل`);
            });

            // تحديد التباين المشبوه
            if (maxCount - minCount > 0) {
                const discrepancy = {
                    table: tableName,
                    maxCount,
                    minCount,
                    difference: maxCount - minCount,
                    environments: envCounts
                };
                this.findings.dataDiscrepancies.push(discrepancy);
                console.log(`   ⚠️ تباين في البيانات: فرق ${maxCount - minCount} سجل`);
            }
        });
    }

    // تحليل النسخ الاحتياطية التلقائية
    async analyzeBackupSystems() {
        console.log('\n💾 تحليل أنظمة النسخ الاحتياطية...\n');

        // فحص مجلد auto_backups
        const autoBackupDir = path.join(this.rootPath, 'auto_backups');
        if (fs.existsSync(autoBackupDir)) {
            const backupFiles = fs.readdirSync(autoBackupDir)
                .filter(f => f.endsWith('.db'))
                .map(f => {
                    const stats = fs.statSync(path.join(autoBackupDir, f));
                    return {
                        name: f,
                        size: stats.size,
                        created: stats.mtime
                    };
                })
                .sort((a, b) => b.created - a.created);

            console.log(`📁 النسخ الاحتياطية التلقائية: ${backupFiles.length} ملف`);
            backupFiles.slice(0, 5).forEach((backup, index) => {
                console.log(`   ${index + 1}. ${backup.name}`);
                console.log(`      📏 الحجم: ${(backup.size / 1024).toFixed(1)} KB`);
                console.log(`      📅 التاريخ: ${backup.created.toLocaleString('ar-SA')}`);
            });

            // فحص الأحدث للمقارنة
            if (backupFiles.length > 0) {
                await this.compareWithLatestBackup(backupFiles[0]);
            }
        } else {
            console.log('❌ لا يوجد مجلد للنسخ الاحتياطية التلقائية');
        }
    }

    // مقارنة مع أحدث نسخة احتياطية
    async compareWithLatestBackup(latestBackup) {
        console.log(`\n🔍 مقارنة مع أحدث نسخة احتياطية: ${latestBackup.name}\n`);

        const backupPath = path.join(this.rootPath, 'auto_backups', latestBackup.name);
        const productionDb = this.potentialDatabases.find(db => db.environment === 'production');

        if (!productionDb) {
            console.log('❌ لا توجد قاعدة بيانات إنتاج للمقارنة');
            return;
        }

        try {
            const backupInfo = {
                name: latestBackup.name,
                path: backupPath,
                size: latestBackup.size,
                modified: latestBackup.created,
                environment: 'backup',
                recordCounts: {}
            };

            await this.analyzeDatabase(backupInfo);

            // مقارنة السجلات
            const criticalTables = ['LessonTemplates', 'ScheduledLessons', 'TextbookEntries'];
            
            criticalTables.forEach(tableName => {
                const prodCount = productionDb.recordCounts[tableName] || 0;
                const backupCount = backupInfo.recordCounts[tableName] || 0;
                const diff = prodCount - backupCount;

                console.log(`📋 ${tableName}:`);
                console.log(`   🏭 الإنتاج: ${prodCount}`);
                console.log(`   💾 النسخة الاحتياطية: ${backupCount}`);
                
                if (diff !== 0) {
                    const status = diff > 0 ? '📈 زيادة' : '📉 نقص';
                    console.log(`   ${status}: ${Math.abs(diff)} سجل`);
                    
                    if (Math.abs(diff) > 5) {
                        console.log(`   ⚠️ تباين كبير محتمل!`);
                    }
                }
            });

        } catch (error) {
            console.error('❌ خطأ في مقارنة النسخة الاحتياطية:', error.message);
        }
    }

    // توليد التوصيات
    generateRecommendations() {
        console.log('\n💡 التوصيات والحلول المقترحة...\n');

        const recommendations = [];

        // توصيات حول تضارب قواعد البيانات
        if (this.findings.databaseConflicts.length > 0) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Database Conflicts',
                title: 'حل تضارب قواعد البيانات',
                description: 'توجد عدة قواعد بيانات في نفس البيئة',
                solution: 'توحيد قواعد البيانات وإزالة المكررات'
            });
        }

        // توصيات حول تباين البيانات
        if (this.findings.dataDiscrepancies.length > 0) {
            const criticalDiscrepancies = this.findings.dataDiscrepancies.filter(d => d.difference > 10);
            if (criticalDiscrepancies.length > 0) {
                recommendations.push({
                    priority: 'CRITICAL',
                    category: 'Data Discrepancies',
                    title: 'تباين حرج في البيانات',
                    description: `توجد فروق كبيرة في ${criticalDiscrepancies.length} جداول`,
                    solution: 'مراجعة عاجلة وتوحيد البيانات'
                });
            }
        }

        // توصيات عامة
        recommendations.push({
            priority: 'MEDIUM',
            category: 'Environment Management',
            title: 'تحسين إدارة البيئات',
            description: 'تطوير نظام واضح لإدارة البيئات المختلفة',
            solution: 'إنشاء متغيرات بيئة واضحة وتوثيق النظام'
        });

        recommendations.forEach((rec, index) => {
            const priorityEmoji = {
                'CRITICAL': '🚨',
                'HIGH': '⚠️',
                'MEDIUM': '🔵',
                'LOW': '🟢'
            };

            console.log(`${priorityEmoji[rec.priority]} ${index + 1}. ${rec.title}`);
            console.log(`   📂 الفئة: ${rec.category}`);
            console.log(`   📝 الوصف: ${rec.description}`);
            console.log(`   💡 الحل: ${rec.solution}`);
            console.log('');
        });

        this.findings.recommendations = recommendations;
    }

    // تشغيل التحليل الشامل
    async runComprehensiveAnalysis() {
        console.log('🏗️ تحليل شامل لبيئات التطبيق');
        console.log('='.repeat(80));
        console.log(`📍 مسار المشروع: ${this.rootPath}\n`);

        try {
            // 1. فحص قواعد البيانات
            await this.scanForDatabases();

            // 2. فحص ملفات التكوين
            await this.scanConfigFiles();

            // 3. تحليل التداخل
            await this.analyzeEnvironmentConflicts();

            // 4. تحليل النسخ الاحتياطية
            await this.analyzeBackupSystems();

            // 5. توليد التوصيات
            this.generateRecommendations();

            // 6. إنشاء التقرير النهائي
            await this.generateFinalReport();

        } catch (error) {
            console.error('❌ خطأ في التحليل الشامل:', error);
        }
    }

    // إنشاء التقرير النهائي
    async generateFinalReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalDatabases: this.potentialDatabases.length,
                totalConfigs: this.configFiles.length,
                conflicts: this.findings.databaseConflicts.length,
                discrepancies: this.findings.dataDiscrepancies.length,
                recommendations: this.findings.recommendations.length
            },
            databases: this.potentialDatabases,
            configs: this.configFiles,
            findings: this.findings
        };

        // حفظ التقرير
        const reportPath = `environment_analysis_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        try {
            fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
            console.log(`\n📄 تم حفظ التقرير الشامل في: ${reportPath}`);
        } catch (error) {
            console.error('❌ خطأ في حفظ التقرير:', error.message);
        }

        // طباعة الملخص
        console.log('\n' + '='.repeat(80));
        console.log('📊 ملخص تحليل البيئات');
        console.log('='.repeat(80));
        console.log(`🗃️ إجمالي قواعد البيانات: ${report.summary.totalDatabases}`);
        console.log(`📄 ملفات التكوين: ${report.summary.totalConfigs}`);
        console.log(`⚠️ التضاربات: ${report.summary.conflicts}`);
        console.log(`📊 تباين البيانات: ${report.summary.discrepancies}`);
        console.log(`💡 التوصيات: ${report.summary.recommendations}`);
        console.log('='.repeat(80));

        return report;
    }
}

// تشغيل التحليل إذا تم استدعاء الملف مباشرة
if (require.main === module) {
    const analyzer = new EnvironmentAnalyzer();
    analyzer.runComprehensiveAnalysis()
        .then(report => {
            console.log('\n✅ تم إكمال التحليل الشامل للبيئات');
        })
        .catch(console.error);
}

module.exports = EnvironmentAnalyzer;