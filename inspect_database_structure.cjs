const sqlite3 = require('sqlite3').verbose();

// فحص بنية قاعدة البيانات
const db = new sqlite3.Database('classroom.db', sqlite3.OPEN_READONLY);

console.log('🔍 فحص بنية قاعدة البيانات...\n');

// الحصول على جميع الجداول
db.all(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`, (err, tables) => {
    if (err) {
        console.error('خطأ:', err);
        return;
    }
    
    console.log('📋 الجداول الموجودة:', tables.map(t => t.name).join(', '));
    console.log('\n' + '='.repeat(80));
    
    let completed = 0;
    const total = tables.length;
    
    tables.forEach(table => {
        console.log(`\n📊 جدول: ${table.name}`);
        console.log('-'.repeat(50));
        
        // الحصول على معلومات الأعمدة
        db.all(`PRAGMA table_info('${table.name}')`, (err, columns) => {
            if (!err && columns) {
                columns.forEach(col => {
                    const nullable = col.notnull === 0 ? 'NULL' : 'NOT NULL';
                    const pk = col.pk === 1 ? ' (PRIMARY KEY)' : '';
                    console.log(`   ${col.name}: ${col.type} ${nullable}${pk}`);
                    if (col.dflt_value) {
                        console.log(`      Default: ${col.dflt_value}`);
                    }
                });
                
                // عد السзаписلات
                db.get(`SELECT COUNT(*) as count FROM ${table.name}`, (err, result) => {
                    if (!err && result) {
                        console.log(`   📊 عدد السجلات: ${result.count}`);
                    }
                    
                    completed++;
                    if (completed === total) {
                        console.log('\n' + '='.repeat(80));
                        console.log('✅ تم الانتهاء من فحص بنية قاعدة البيانات');
                        db.close();
                    }
                });
            } else {
                completed++;
                if (completed === total) {
                    console.log('\n' + '='.repeat(80));
                    console.log('✅ تم الانتهاء من فحص بنية قاعدة البيانات');
                    db.close();
                }
            }
        });
    });
    
    if (tables.length === 0) {
        console.log('⚠️ لا توجد جداول في قاعدة البيانات');
        db.close();
    }
});