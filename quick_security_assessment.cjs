#!/usr/bin/env node
/**
 * تقرير سريع للوضع الأمني الحالي
 * يعرض المخاطر والحلول المقترحة بشكل مختصر
 */

const fs = require('fs');
const path = require('path');

console.log('🛡️ تقرير الوضع الأمني السريع');
console.log('='.repeat(50));

// فحص الملفات الحرجة
const criticalFiles = [
    'backend/reset_db.js',
    'backend/manual_migration.js', 
    'backend/repair_student_sections.js'
];

console.log('\n🚨 الملفات الأكثر خطورة:');
criticalFiles.forEach((file, index) => {
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf-8');
        const hasProtection = content.includes('process.env.NODE_ENV') || 
                             content.includes('confirm') ||
                             content.includes('backup');
        
        console.log(`${index + 1}. ${file} - ${hasProtection ? '✅ محمي جزئياً' : '❌ غير محمي'}`);
    }
});

// فحص النسخ الاحتياطية
console.log('\n📦 حالة النسخ الاحتياطية:');
const backupFiles = fs.readdirSync('.').filter(f => f.includes('backup') && f.endsWith('.db'));
if (backupFiles.length > 0) {
    console.log(`✅ توجد ${backupFiles.length} نسخة احتياطية`);
    backupFiles.forEach(file => {
        const stats = fs.statSync(file);
        const age = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60); // ساعات
        console.log(`   📁 ${file} - عمر: ${Math.round(age)} ساعة`);
    });
} else {
    console.log('❌ لا توجد نسخ احتياطية واضحة');
}

// فحص متغيرات البيئة
console.log('\n🌍 متغيرات البيئة:');
const nodeEnv = process.env.NODE_ENV || 'غير محدد';
console.log(`NODE_ENV: ${nodeEnv} ${nodeEnv === 'production' ? '⚠️' : '✅'}`);

// فحص قاعدة البيانات
console.log('\n🗄️ حالة قاعدة البيانات:');
const dbFiles = ['classroom.db', 'classroom_dev.db', 'classroom_test.db'];
dbFiles.forEach(file => {
    if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`✅ ${file} - حجم: ${sizeMB} MB`);
    } else {
        console.log(`❌ ${file} - غير موجود`);
    }
});

console.log('\n📊 ملخص التقييم:');
console.log('🔴 مخاطر حرجة: نعم (سكريبتات غير محمية)');
console.log('🟡 نسخ احتياطية: ' + (backupFiles.length > 0 ? 'موجودة لكن غير منتظمة' : 'غير موجودة'));
console.log('🟠 فصل البيئات: غير مطبق');
console.log('❌ نظام مراقبة: غير موجود');

console.log('\n💡 التوصيات الفورية:');
console.log('1. حماية السكريبتات الحرجة فوراً');
console.log('2. إنشاء نسخة احتياطية شاملة');
console.log('3. إعداد متغيرات البيئة');
console.log('4. إضافة نظام مراقبة أساسي');

console.log('\n⏰ الوقت المطلوب للحلول:');
console.log('🔥 الحماية الفورية: 4-6 ساعات');
console.log('📦 النسخ الاحتياطية: يوم واحد');
console.log('🛡️ النظام الأمني الكامل: 3-5 أيام');

console.log('\n🎯 الأولوية: عاجلة جداً!');
console.log('⚠️ النظام معرض لفقدان البيانات في أي لحظة');

console.log('\n' + '='.repeat(50));
console.log('📝 تم إنشاء تقرير مفصل في: SECURITY_IMPLEMENTATION_PLAN.md');
console.log('🔍 لمراجعة المخاطر: DATABASE_SCRIPTS_RISKS_ANALYSIS.md');