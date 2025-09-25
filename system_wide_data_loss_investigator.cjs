const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

/**
 * تحقيق شامل في فقدان البيانات عبر النظام بأكمله
 * Comprehensive System-wide Data Loss Investigation
 */

class SystemWideDataLossInvestigator {
    constructor(dbPath = 'classroom.db') {
        this.dbPath = dbPath;
        this.db = null;
        this.backupDbPath = null;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READONLY, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('✅ متصل بقاعدة البيانات الحالية');
                    resolve();
                }
            });
        });
    }

    // البحث عن النسخة الاحتياطية الأحدث
    async findLatestBackup() {
        const backupFiles = fs.readdirSync('.')
            .filter(file => file.startsWith('classroom_backup') && file.endsWith('.db'))
            .sort((a, b) => {
                const statA = fs.statSync(a);
                const statB = fs.statSync(b);
                return statB.mtime - statA.mtime;
            });

        if (backupFiles.length > 0) {
            this.backupDbPath = backupFiles[0];
            console.log(`📁 تم العثور على النسخة الاحتياطية: ${this.backupDbPath}`);
            return this.backupDbPath;
        }
        return null;
    }

    // تشغيل استعلام على قاعدة البيانات
    async runQuery(query, params = [], dbPath = null) {
        return new Promise((resolve, reject) => {
            const targetDb = dbPath ? new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY) : this.db;
            
            targetDb.all(query, params, (err, rows) => {
                if (dbPath) targetDb.close();
                
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    // فحص جدول الأحداث/الجدول الزمني
    async investigateScheduleEvents() {
        console.log('\n🔍 فحص جدول الأحداث والجدول الزمني...');
        
        const tables = ['AdminScheduleEntries', 'administrative_timetable'];
        const results = {};

        for (const table of tables) {
            try {
                console.log(`\n📊 فحص جدول: ${table}`);
                
                // البيانات الحالية
                const currentData = await this.runQuery(`SELECT * FROM ${table} ORDER BY createdAt DESC`);
                console.log(`   📋 البيانات الحالية: ${currentData.length} سجل`);
                
                // البيانات في النسخة الاحتياطية (إذا توفرت)
                let backupData = [];
                if (this.backupDbPath) {
                    try {
                        backupData = await this.runQuery(`SELECT * FROM ${table} ORDER BY createdAt DESC`, [], this.backupDbPath);
                        console.log(`   💾 البيانات في النسخة الاحتياطية: ${backupData.length} سجل`);
                    } catch (error) {
                        console.log(`   ⚠️ لا يمكن قراءة ${table} من النسخة الاحتياطية`);
                    }
                }

                results[table] = {
                    current: currentData,
                    backup: backupData,
                    missing: backupData.length - currentData.length
                };

                // تحليل سريع للبيانات المفقودة
                if (backupData.length > currentData.length) {
                    console.log(`   🚨 مفقود: ${backupData.length - currentData.length} سجل`);
                    
                    // عرض عينة من البيانات المفقودة
                    const currentIds = new Set(currentData.map(item => item.id));
                    const missingItems = backupData.filter(item => !currentIds.has(item.id));
                    
                    console.log(`   📝 عينة من البيانات المفقودة:`);
                    missingItems.slice(0, 3).forEach((item, index) => {
                        console.log(`      ${index + 1}. ID: ${item.id} - ${item.day || item.date || 'غير محدد'}`);
                    });
                }

            } catch (error) {
                console.error(`   ❌ خطأ في فحص ${table}:`, error.message);
                results[table] = { error: error.message };
            }
        }

        return results;
    }

    // فحص جداول أخرى مهمة
    async investigateOtherTables() {
        console.log('\n🔍 فحص الجداول المهمة الأخرى...');
        
        const tablesToCheck = [
            'Sections',
            'Students', 
            'LessonTemplates',
            'StudentAssessments',
            'Lessons'
        ];

        const results = {};

        for (const table of tablesToCheck) {
            try {
                console.log(`\n📊 فحص جدول: ${table}`);
                
                // البيانات الحالية
                const currentData = await this.runQuery(`SELECT COUNT(*) as count FROM ${table}`);
                const currentCount = currentData[0]?.count || 0;
                console.log(`   📋 البيانات الحالية: ${currentCount} سجل`);
                
                // البيانات في النسخة الاحتياطية
                let backupCount = 0;
                if (this.backupDbPath) {
                    try {
                        const backupData = await this.runQuery(`SELECT COUNT(*) as count FROM ${table}`, [], this.backupDbPath);
                        backupCount = backupData[0]?.count || 0;
                        console.log(`   💾 البيانات في النسخة الاحتياطية: ${backupCount} سجل`);
                    } catch (error) {
                        console.log(`   ⚠️ لا يمكن قراءة ${table} من النسخة الاحتياطية`);
                    }
                }

                results[table] = {
                    currentCount,
                    backupCount,
                    missing: backupCount - currentCount
                };

                if (backupCount > currentCount) {
                    console.log(`   🚨 مفقود: ${backupCount - currentCount} سجل`);
                }

            } catch (error) {
                console.error(`   ❌ خطأ في فحص ${table}:`, error.message);
                results[table] = { error: error.message };
            }
        }

        return results;
    }

    // فحص البيانات المُدخلة حديثاً
    async investigateRecentData() {
        console.log('\n🔍 فحص البيانات المُدخلة حديثاً...');
        
        const recentQueries = {
            'أحداث الأسبوع الماضي': `
                SELECT 'AdminScheduleEntries' as table_name, COUNT(*) as count
                FROM AdminScheduleEntries 
                WHERE createdAt >= date('now', '-7 days')
                UNION ALL
                SELECT 'administrative_timetable' as table_name, COUNT(*) as count
                FROM administrative_timetable 
                WHERE createdAt >= date('now', '-7 days')
            `,
            'دروس الأسبوع الماضي': `
                SELECT COUNT(*) as count FROM TextbookEntries 
                WHERE createdAt >= date('now', '-7 days')
            `,
            'قوالب حديثة': `
                SELECT COUNT(*) as count FROM LessonTemplates 
                WHERE createdAt >= date('now', '-7 days')
            `
        };

        const results = {};
        
        for (const [description, query] of Object.entries(recentQueries)) {
            try {
                const currentData = await this.runQuery(query);
                console.log(`   📅 ${description}: ${JSON.stringify(currentData)}`);
                results[description] = { current: currentData };
                
                if (this.backupDbPath) {
                    try {
                        const backupData = await this.runQuery(query, [], this.backupDbPath);
                        console.log(`   💾 ${description} (نسخة احتياطية): ${JSON.stringify(backupData)}`);
                        results[description].backup = backupData;
                    } catch (error) {
                        console.log(`   ⚠️ لا يمكن قراءة البيانات الحديثة من النسخة الاحتياطية`);
                    }
                }
            } catch (error) {
                console.error(`   ❌ خطأ في فحص ${description}:`, error.message);
            }
        }

        return results;
    }

    // البحث عن أنماط فقدان البيانات
    async analyzeDataLossPatterns() {
        console.log('\n🔍 تحليل أنماط فقدان البيانات...');
        
        const patterns = [];

        // فحص التواريخ المشبوهة
        try {
            const suspiciousDates = await this.runQuery(`
                SELECT 
                    date(createdAt) as creation_date,
                    COUNT(*) as records_created
                FROM (
                    SELECT createdAt FROM TextbookEntries
                    UNION ALL
                    SELECT createdAt FROM AdminScheduleEntries
                    UNION ALL 
                    SELECT createdAt FROM administrative_timetable
                ) 
                WHERE createdAt IS NOT NULL
                GROUP BY date(createdAt)
                ORDER BY creation_date DESC
                LIMIT 10
            `);

            console.log('   📅 نشاط إنشاء السجلات الأخير:');
            suspiciousDates.forEach(row => {
                console.log(`      ${row.creation_date}: ${row.records_created} سجل`);
            });

            patterns.push({
                type: 'creation_activity',
                data: suspiciousDates
            });

        } catch (error) {
            console.error('   ❌ خطأ في تحليل التواريخ:', error.message);
        }

        return patterns;
    }

    // تشغيل التحقيق الشامل
    async runFullInvestigation() {
        console.log('🚨 بدء التحقيق الشامل في فقدان البيانات عبر النظام');
        console.log('='.repeat(80));

        const investigation = {
            timestamp: new Date().toISOString(),
            backup_found: false,
            findings: {}
        };

        try {
            await this.connect();
            
            // البحث عن النسخة الاحتياطية
            const backupPath = await this.findLatestBackup();
            investigation.backup_found = !!backupPath;

            // 1. فحص الأحداث والجدول الزمني
            console.log('\n' + '='.repeat(50));
            investigation.findings.scheduleEvents = await this.investigateScheduleEvents();

            // 2. فحص الجداول الأخرى
            console.log('\n' + '='.repeat(50));
            investigation.findings.otherTables = await this.investigateOtherTables();

            // 3. فحص البيانات الحديثة
            console.log('\n' + '='.repeat(50));
            investigation.findings.recentData = await this.investigateRecentData();

            // 4. تحليل الأنماط
            console.log('\n' + '='.repeat(50));
            investigation.findings.patterns = await this.analyzeDataLossPatterns();

            // إنشاء التقرير الشامل
            this.generateInvestigationReport(investigation);

            return investigation;

        } catch (error) {
            console.error('❌ خطأ في التحقيق:', error);
            throw error;
        } finally {
            if (this.db) this.db.close();
        }
    }

    // إنشاء تقرير التحقيق
    generateInvestigationReport(investigation) {
        console.log('\n' + '='.repeat(80));
        console.log('📋 تقرير التحقيق الشامل في فقدان البيانات');
        console.log('='.repeat(80));

        // حالة النسخة الاحتياطية
        if (investigation.backup_found) {
            console.log('✅ تم العثور على نسخة احتياطية للمقارنة');
        } else {
            console.log('⚠️ لا توجد نسخة احتياطية للمقارنة');
        }

        // ملخص المشاكل المكتشفة
        let totalMissing = 0;
        const criticalTables = [];

        Object.entries(investigation.findings.scheduleEvents || {}).forEach(([table, data]) => {
            if (data.missing > 0) {
                totalMissing += data.missing;
                criticalTables.push(`${table}: ${data.missing} سجل مفقود`);
            }
        });

        Object.entries(investigation.findings.otherTables || {}).forEach(([table, data]) => {
            if (data.missing > 0) {
                totalMissing += data.missing;
                criticalTables.push(`${table}: ${data.missing} سجل مفقود`);
            }
        });

        console.log(`\n🚨 إجمالي السجلات المفقودة: ${totalMissing}`);
        
        if (criticalTables.length > 0) {
            console.log('\n❌ الجداول المتأثرة:');
            criticalTables.forEach(issue => {
                console.log(`   • ${issue}`);
            });
        }

        // تحديد مستوى الخطورة
        let severity = 'منخفض';
        if (totalMissing > 10) severity = 'متوسط';
        if (totalMissing > 50) severity = 'عالي';
        if (totalMissing > 100 || criticalTables.length > 3) severity = 'حرج';

        console.log(`\n⚡ مستوى الخطورة: ${severity}`);

        // التوصيات
        console.log('\n💡 التوصيات العاجلة:');
        if (totalMissing > 0) {
            console.log('   1. 🔧 استعادة البيانات المفقودة من النسخة الاحتياطية');
            console.log('   2. 🛡️ تطبيق نظام حماية شامل لمنع تكرار المشكلة');
            console.log('   3. 🔍 تحديد السبب الجذري لفقدان البيانات');
        }
        console.log('   4. 📊 تطبيق نظام مراقبة دوري');
        console.log('   5. 💾 تحسين استراتيجية النسخ الاحتياطية');

        console.log('\n' + '='.repeat(80));

        // حفظ التقرير
        const reportPath = `investigation_report_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        try {
            fs.writeFileSync(reportPath, JSON.stringify(investigation, null, 2));
            console.log(`💾 تم حفظ تقرير التحقيق في: ${reportPath}`);
        } catch (error) {
            console.error('❌ خطأ في حفظ التقرير:', error.message);
        }
    }

    close() {
        if (this.db) {
            this.db.close();
        }
    }
}

// تشغيل التحقيق إذا تم استدعاء الملف مباشرة
if (require.main === module) {
    const investigator = new SystemWideDataLossInvestigator();
    investigator.runFullInvestigation()
        .then(results => {
            console.log('\n✅ تم الانتهاء من التحقيق الشامل');
        })
        .catch(console.error);
}

module.exports = SystemWideDataLossInvestigator;