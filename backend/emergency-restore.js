const fs = require('fs');
const { Attendance } = require('./models');

async function emergencyRestore() {
  try {
    console.log('🚨 بدء عملية الاستعادة الطارئة...\n');

    // 1. حذف البيانات المولدة تلقائياً
    console.log('🗑️ حذف البيانات المولدة تلقائياً...');
    const deletedCount = await Attendance.destroy({
      where: {},
      truncate: true
    });
    console.log(`✅ تم حذف ${deletedCount} سجل مولد تلقائياً`);

    // 2. إنشاء نسخة احتياطية من الحالة الحالية
    const backupName = `classroom_before_restore_${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
    fs.copyFileSync('../classroom.db', `../${backupName}`);
    console.log(`✅ تم إنشاء نسخة احتياطية: ${backupName}`);

    // 3. استعادة قاعدة البيانات الأصلية
    console.log('📦 استعادة قاعدة البيانات الأصلية...');
    fs.copyFileSync('../classroom_backup_20250924_174347.db', '../classroom.db');
    console.log('✅ تم استعادة قاعدة البيانات الأصلية');

    console.log('\n🎉 تمت الاستعادة بنجاح!');
    console.log('⚠️ يرجى إعادة تشغيل الخادم لتطبيق التغييرات');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ في الاستعادة:', error);
    process.exit(1);
  }
}

emergencyRestore();