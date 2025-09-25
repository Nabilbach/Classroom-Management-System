const sqlite3 = require('sqlite3').verbose();

// فحص تفصيلي لجدول Lessons
const db = new sqlite3.Database('classroom.db', sqlite3.OPEN_READONLY);

console.log('🔍 فحص تفصيلي لجدول Lessons...\n');

// الحصول على معلومات الأعمدة
db.all(`PRAGMA table_info('Lessons')`, (err, columns) => {
    if (err) {
        console.error('خطأ:', err);
        return;
    }
    
    console.log('📊 أعمدة جدول Lessons:');
    console.log('-'.repeat(60));
    columns.forEach((col, index) => {
        const nullable = col.notnull === 0 ? 'NULL' : 'NOT NULL';
        const pk = col.pk === 1 ? ' (PRIMARY KEY)' : '';
        const def = col.dflt_value ? ` Default: ${col.dflt_value}` : '';
        console.log(`${index + 1}. ${col.name}: ${col.type} ${nullable}${pk}${def}`);
    });
    
    // عينة من البيانات
    console.log('\n📋 عينة من البيانات (أول 3 سجلات):');
    console.log('-'.repeat(60));
    
    db.all(`SELECT * FROM Lessons LIMIT 3`, (err, rows) => {
        if (!err && rows && rows.length > 0) {
            rows.forEach((row, index) => {
                console.log(`\nسجل ${index + 1}:`);
                Object.keys(row).forEach(key => {
                    let value = row[key];
                    if (typeof value === 'string' && value.length > 50) {
                        value = value.substring(0, 50) + '...';
                    }
                    console.log(`   ${key}: ${value}`);
                });
            });
        } else {
            console.log('لا توجد بيانات في الجدول أو حدث خطأ');
        }
        
        // فحص أيضاً جدول TextbookEntries
        console.log('\n' + '='.repeat(80));
        console.log('🔍 فحص تفصيلي لجدول TextbookEntries...\n');
        
        db.all(`PRAGMA table_info('TextbookEntries')`, (err, columns) => {
            if (!err && columns) {
                console.log('📊 أعمدة جدول TextbookEntries:');
                console.log('-'.repeat(60));
                columns.forEach((col, index) => {
                    const nullable = col.notnull === 0 ? 'NULL' : 'NOT NULL';
                    const pk = col.pk === 1 ? ' (PRIMARY KEY)' : '';
                    const def = col.dflt_value ? ` Default: ${col.dflt_value}` : '';
                    console.log(`${index + 1}. ${col.name}: ${col.type} ${nullable}${pk}${def}`);
                });
                
                // عينة من البيانات
                console.log('\n📋 عينة من بيانات TextbookEntries (أول 3 سجلات):');
                console.log('-'.repeat(60));
                
                db.all(`SELECT * FROM TextbookEntries LIMIT 3`, (err, rows) => {
                    if (!err && rows && rows.length > 0) {
                        rows.forEach((row, index) => {
                            console.log(`\nسجل ${index + 1}:`);
                            Object.keys(row).forEach(key => {
                                let value = row[key];
                                if (typeof value === 'string' && value.length > 50) {
                                    value = value.substring(0, 50) + '...';
                                }
                                console.log(`   ${key}: ${value}`);
                            });
                        });
                    } else {
                        console.log('لا توجد بيانات في الجدول أو حدث خطأ');
                    }
                    
                    db.close();
                    console.log('\n✅ تم الانتهاء من الفحص التفصيلي');
                });
            } else {
                db.close();
            }
        });
    });
});