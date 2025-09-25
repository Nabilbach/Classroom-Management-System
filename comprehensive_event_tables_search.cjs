const sqlite3 = require('sqlite3').verbose();

/**
 * البحث الشامل عن جميع جداول الأحداث في النظام
 * Comprehensive Search for All Event Tables in System
 */

console.log('🔍 البحث الشامل عن جداول الأحداث في النظام\n');

const currentDb = new sqlite3.Database('classroom.db', sqlite3.OPEN_READONLY);
const backupDb = new sqlite3.Database('classroom_backup_20250924_174347.db', sqlite3.OPEN_READONLY);

// البحث عن جميع الجداول التي قد تحتوي على أحداث
function findAllEventTables() {
    console.log('📋 البحث عن جميع الجداول المحتملة...\n');
    
    currentDb.all(`
        SELECT name, sql FROM sqlite_master 
        WHERE type='table' 
        AND name NOT LIKE 'sqlite_%'
        ORDER BY name
    `, (err, tables) => {
        if (err) {
            console.error('❌ خطأ في قراءة الجداول:', err);
            return;
        }
        
        console.log(`📊 إجمالي الجداول الموجودة: ${tables.length}\n`);
        
        // فحص كل جدول للبحث عن البيانات المتعلقة بالأحداث
        let completed = 0;
        const eventRelatedTables = [];
        
        tables.forEach(table => {
            // فحص البيانات في كل جدول
            currentDb.all(`SELECT * FROM ${table.name} LIMIT 3`, (err, sampleData) => {
                completed++;
                
                if (!err && sampleData && sampleData.length > 0) {
                    const firstRecord = sampleData[0];
                    const columns = Object.keys(firstRecord);
                    
                    // البحث عن الأعمدة المرتبطة بالأحداث/الجدولة
                    const eventKeywords = ['event', 'schedule', 'time', 'day', 'date', 'lesson', 'class'];
                    const hasEventColumns = columns.some(col => 
                        eventKeywords.some(keyword => col.toLowerCase().includes(keyword))
                    );
                    
                    if (hasEventColumns || table.name.toLowerCase().includes('event') || 
                        table.name.toLowerCase().includes('schedule') || 
                        table.name.toLowerCase().includes('time')) {
                        
                        eventRelatedTables.push({
                            name: table.name,
                            recordCount: sampleData.length,
                            columns: columns,
                            sampleData: firstRecord
                        });
                    }
                }
                
                // عند الانتهاء من فحص جميع الجداول
                if (completed === tables.length) {
                    console.log('='.repeat(80));
                    console.log('📊 الجداول المرتبطة بالأحداث/الجدولة');
                    console.log('='.repeat(80));
                    
                    eventRelatedTables.forEach((table, index) => {
                        console.log(`\n${index + 1}. جدول: ${table.name}`);
                        console.log(`   📋 الأعمدة: ${table.columns.join(', ')}`);
                        console.log(`   📊 عينة من البيانات:`);
                        Object.entries(table.sampleData).forEach(([key, value]) => {
                            let displayValue = value;
                            if (typeof value === 'string' && value.length > 50) {
                                displayValue = value.substring(0, 50) + '...';
                            }
                            console.log(`      ${key}: ${displayValue}`);
                        });
                    });
                    
                    // الآن قارن هذه الجداول مع النسخة الاحتياطية
                    compareEventTables(eventRelatedTables);
                }
            });
        });
    });
}

function compareEventTables(eventTables) {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 مقارنة جداول الأحداث مع النسخة الاحتياطية');
    console.log('='.repeat(80));
    
    let completedComparisons = 0;
    const comparisonResults = [];
    
    eventTables.forEach(tableInfo => {
        const tableName = tableInfo.name;
        
        // عدد السجلات في قاعدة البيانات الحالية
        currentDb.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, currentResult) => {
            if (err) {
                console.error(`❌ خطأ في قراءة ${tableName}:`, err.message);
                completedComparisons++;
                return;
            }
            
            const currentCount = currentResult.count;
            
            // عدد السجلات في النسخة الاحتياطية
            backupDb.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, backupResult) => {
                completedComparisons++;
                
                let backupCount = 0;
                if (!err && backupResult) {
                    backupCount = backupResult.count;
                }
                
                const difference = backupCount - currentCount;
                
                console.log(`\n📊 جدول ${tableName}:`);
                console.log(`   📋 الحالي: ${currentCount} سجل`);
                console.log(`   💾 النسخة الاحتياطية: ${backupCount} سجل`);
                
                if (difference > 0) {
                    console.log(`   🚨 مفقود: ${difference} سجل`);
                    
                    // فحص تفصيلي للبيانات المفقودة
                    examineDetailedDifferences(tableName, currentCount, backupCount);
                } else if (difference < 0) {
                    console.log(`   ➕ جديد: ${Math.abs(difference)} سجل`);
                } else {
                    console.log(`   ✅ متطابق`);
                }
                
                comparisonResults.push({
                    table: tableName,
                    current: currentCount,
                    backup: backupCount,
                    difference: difference
                });
                
                // عند الانتهاء من جميع المقارنات
                if (completedComparisons === eventTables.length) {
                    generateFinalReport(comparisonResults);
                }
            });
        });
    });
}

function examineDetailedDifferences(tableName, currentCount, backupCount) {
    if (backupCount <= currentCount) return;
    
    console.log(`\n🔍 فحص تفصيلي للاختلافات في ${tableName}:`);
    
    // جلب عينة من البيانات المفقودة
    backupDb.all(`SELECT * FROM ${tableName} ORDER BY rowid DESC LIMIT 5`, (err, backupSample) => {
        if (!err && backupSample && backupSample.length > 0) {
            console.log(`   📋 عينة من البيانات في النسخة الاحتياطية:`);
            backupSample.forEach((record, index) => {
                console.log(`      ${index + 1}. ID: ${record.id || 'غير محدد'}`);
                
                // عرض أهم المعلومات
                Object.entries(record).slice(0, 4).forEach(([key, value]) => {
                    if (key !== 'id') {
                        let displayValue = value;
                        if (typeof value === 'string' && value.length > 30) {
                            displayValue = value.substring(0, 30) + '...';
                        }
                        console.log(`         ${key}: ${displayValue}`);
                    }
                });
            });
        }
    });
}

function generateFinalReport(results) {
    console.log('\n' + '='.repeat(80));
    console.log('📋 التقرير النهائي - حالة جداول الأحداث');
    console.log('='.repeat(80));
    
    const tablesWithIssues = results.filter(r => r.difference !== 0);
    const missingData = results.filter(r => r.difference > 0);
    const newData = results.filter(r => r.difference < 0);
    
    console.log(`\n📊 الإحصائيات العامة:`);
    console.log(`   📋 إجمالي الجداول المفحوصة: ${results.length}`);
    console.log(`   ⚖️ جداول متطابقة: ${results.length - tablesWithIssues.length}`);
    console.log(`   ❌ جداول بها مشاكل: ${tablesWithIssues.length}`);
    
    if (missingData.length > 0) {
        console.log(`\n🚨 جداول بها بيانات مفقودة:`);
        missingData.forEach(result => {
            console.log(`   • ${result.table}: ${result.difference} سجل مفقود`);
        });
    }
    
    if (newData.length > 0) {
        console.log(`\n➕ جداول بها بيانات جديدة:`);
        newData.forEach(result => {
            console.log(`   • ${result.table}: ${Math.abs(result.difference)} سجل جديد`);
        });
    }
    
    // توصيات
    console.log(`\n💡 التوصيات:`);
    if (missingData.length > 0) {
        console.log(`   1. 🔧 استعادة البيانات المفقودة من النسخة الاحتياطية`);
        console.log(`   2. 🔍 تحديد سبب فقدان البيانات`);
        console.log(`   3. 🛡️ تطبيق آليات حماية للجداول المتأثرة`);
    } else {
        console.log(`   1. ✅ جميع البيانات سليمة`);
        console.log(`   2. 📊 تفعيل المراقبة الدورية للوقاية`);
    }
    console.log(`   3. 💾 إنشاء نسخة احتياطية محدثة`);
    
    // إغلاق الاتصالات
    currentDb.close();
    backupDb.close();
    
    console.log('\n✅ تم الانتهاء من التحقيق الشامل');
}

// بدء التحقيق
findAllEventTables();