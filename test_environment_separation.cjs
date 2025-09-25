#!/usr/bin/env node
// 🧪 اختبار شامل لفصل البيئات وسلامة البيانات
// Environment Separation Validation Test

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 اختبار فصل البيئات والتحقق من السلامة');
console.log('='.repeat(60));

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const testResults = {
  timestamp,
  environments: {},
  ports: {},
  databases: {},
  configs: {},
  security: {},
  recommendations: []
};

// 1️⃣ فحص قواعد البيانات
console.log('\n1️⃣ فحص قواعد البيانات...');

const databases = [
  { name: 'إنتاج', path: './classroom.db', expectedPort: 3000 },
  { name: 'تطوير', path: './classroom_dev.db', expectedPort: 3001 },
  { name: 'اختبار', path: './classroom_test.db', expectedPort: 3002 }
];

databases.forEach(db => {
  try {
    const stats = fs.statSync(db.path);
    const sizeKB = Math.round(stats.size / 1024);
    
    testResults.databases[db.name] = {
      exists: true,
      size: `${sizeKB} KB`,
      lastModified: stats.mtime.toISOString(),
      status: sizeKB > 100 ? '✅ صالح' : '⚠️ صغير'
    };
    
    console.log(`   ${db.name}: ${sizeKB} KB - ${testResults.databases[db.name].status}`);
  } catch (error) {
    testResults.databases[db.name] = {
      exists: false,
      error: error.message,
      status: '❌ مفقود'
    };
    console.log(`   ${db.name}: ❌ مفقود`);
  }
});

// 2️⃣ فحص ملفات التكوين
console.log('\n2️⃣ فحص ملفات التكوين...');

const configs = [
  { name: 'إنتاج', file: '.env.production', port: 3000 },
  { name: 'تطوير', file: '.env.development', port: 3001 },
  { name: 'اختبار', file: '.env.testing', port: 3002 }
];

configs.forEach(config => {
  try {
    const content = fs.readFileSync(config.file, 'utf8');
    const portMatch = content.match(/PORT=(\d+)/);
    const dbMatch = content.match(/DATABASE_PATH=(.+)/);
    
    testResults.configs[config.name] = {
      exists: true,
      port: portMatch ? parseInt(portMatch[1]) : null,
      database: dbMatch ? dbMatch[1] : null,
      portCorrect: portMatch && parseInt(portMatch[1]) === config.port,
      status: portMatch && parseInt(portMatch[1]) === config.port ? '✅ صحيح' : '❌ خطأ'
    };
    
    console.log(`   ${config.name}: منفذ ${portMatch ? portMatch[1] : '؟'} - ${testResults.configs[config.name].status}`);
  } catch (error) {
    testResults.configs[config.name] = {
      exists: false,
      error: error.message,
      status: '❌ مفقود'
    };
    console.log(`   ${config.name}: ❌ مفقود`);
  }
});

// 3️⃣ فحص سكريبتات التشغيل
console.log('\n3️⃣ فحص سكريبتات التشغيل...');

const scripts = [
  { name: 'إنتاج', file: 'start-production.bat' },
  { name: 'تطوير', file: 'start-development.bat' },
  { name: 'اختبار', file: 'start-testing.bat' }
];

scripts.forEach(script => {
  try {
    const content = fs.readFileSync(script.file, 'utf8');
    const hasEnvFile = content.includes('.env');
    const hasCorrectCommand = content.includes('npm start') || content.includes('node');
    
    testResults.environments[script.name] = {
      scriptExists: true,
      hasEnvConfig: hasEnvFile,
      hasStartCommand: hasCorrectCommand,
      status: hasEnvFile && hasCorrectCommand ? '✅ جاهز' : '⚠️ ناقص'
    };
    
    console.log(`   ${script.name}: ${testResults.environments[script.name].status}`);
  } catch (error) {
    testResults.environments[script.name] = {
      scriptExists: false,
      error: error.message,
      status: '❌ مفقود'
    };
    console.log(`   ${script.name}: ❌ مفقود`);
  }
});

// 4️⃣ فحص المنافذ (Port Conflict Detection)
console.log('\n4️⃣ فحص تضارب المنافذ...');

const expectedPorts = [3000, 3001, 3002];
expectedPorts.forEach(port => {
  try {
    // محاولة الاتصال بالمنفذ لمعرفة إذا كان مستخدماً
    execSync(`netstat -an | findstr :${port}`, { stdio: 'pipe' });
    testResults.ports[port] = {
      inUse: true,
      status: '⚠️ مستخدم'
    };
    console.log(`   منفذ ${port}: ⚠️ مستخدم حالياً`);
  } catch (error) {
    testResults.ports[port] = {
      inUse: false,
      status: '✅ متاح'
    };
    console.log(`   منفذ ${port}: ✅ متاح`);
  }
});

// 5️⃣ فحص النسخ الاحتياطية
console.log('\n5️⃣ فحص النسخ الاحتياطية...');

const backupDirs = [
  './emergency_backups',
  './emergency_environment_backups'
];

let totalBackups = 0;
backupDirs.forEach(dir => {
  try {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.db'));
    totalBackups += files.length;
    console.log(`   ${dir}: ${files.length} نسخة احتياطية`);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = Math.round(stats.size / 1024);
      console.log(`     - ${file}: ${sizeKB} KB`);
    });
  } catch (error) {
    console.log(`   ${dir}: ❌ غير موجود`);
  }
});

testResults.security.backups = {
  total: totalBackups,
  status: totalBackups >= 3 ? '✅ كافية' : '⚠️ غير كافية'
};

// 6️⃣ تحليل الأمان والتوصيات
console.log('\n6️⃣ تحليل الأمان...');

// فحص عدم وجود تداخل في المنافذ
const configPorts = Object.values(testResults.configs)
  .map(c => c.port)
  .filter(p => p !== null);

const uniquePorts = [...new Set(configPorts)];
const hasPortConflict = configPorts.length !== uniquePorts.length;

testResults.security.portSeparation = {
  hasConflict: hasPortConflict,
  status: hasPortConflict ? '❌ تداخل' : '✅ منفصل'
};

// فحص وجود قواعد بيانات منفصلة
const dbFiles = Object.values(testResults.databases)
  .filter(db => db.exists).length;

testResults.security.databaseSeparation = {
  separateDBs: dbFiles,
  status: dbFiles >= 3 ? '✅ منفصل' : '⚠️ غير مكتمل'
};

console.log(`   فصل المنافذ: ${testResults.security.portSeparation.status}`);
console.log(`   فصل قواعد البيانات: ${testResults.security.databaseSeparation.status}`);
console.log(`   النسخ الاحتياطية: ${testResults.security.backups.status}`);

// 7️⃣ توليد التوصيات
console.log('\n7️⃣ التوصيات...');

if (hasPortConflict) {
  testResults.recommendations.push('🔧 إصلاح تضارب المنافذ في ملفات التكوين');
}

if (dbFiles < 3) {
  testResults.recommendations.push('📁 إنشاء قواعد بيانات منفصلة للبيئات المفقودة');
}

if (totalBackups < 3) {
  testResults.recommendations.push('💾 إنشاء المزيد من النسخ الاحتياطية');
}

const missingScripts = scripts.filter(s => !testResults.environments[s.name]?.scriptExists);
if (missingScripts.length > 0) {
  testResults.recommendations.push('📜 إنشاء سكريبتات التشغيل المفقودة');
}

if (testResults.recommendations.length === 0) {
  testResults.recommendations.push('🎉 جميع البيئات مُعدة بشكل صحيح!');
  console.log('   🎉 جميع البيئات مُعدة بشكل صحيح!');
} else {
  testResults.recommendations.forEach(rec => {
    console.log(`   ${rec}`);
  });
}

// 8️⃣ حفظ تقرير الاختبار
console.log('\n8️⃣ حفظ تقرير الاختبار...');

const reportFile = `environment_test_report_${timestamp}.json`;
fs.writeFileSync(reportFile, JSON.stringify(testResults, null, 2));
console.log(`   تم حفظ التقرير: ${reportFile}`);

// ملخص نهائي
console.log('\n' + '='.repeat(60));
console.log('📊 ملخص الاختبار:');
console.log('='.repeat(60));

const totalChecks = Object.keys(testResults.databases).length + 
                   Object.keys(testResults.configs).length + 
                   Object.keys(testResults.environments).length;

const passedChecks = Object.values(testResults.databases).filter(db => db.exists).length +
                    Object.values(testResults.configs).filter(cfg => cfg.exists && cfg.portCorrect).length +
                    Object.values(testResults.environments).filter(env => env.scriptExists).length;

const successRate = Math.round((passedChecks / totalChecks) * 100);

console.log(`🎯 معدل النجاح: ${successRate}% (${passedChecks}/${totalChecks})`);
console.log(`💾 قواعد البيانات: ${Object.values(testResults.databases).filter(db => db.exists).length}/3`);
console.log(`⚙️ ملفات التكوين: ${Object.values(testResults.configs).filter(cfg => cfg.exists).length}/3`);
console.log(`📜 سكريبتات التشغيل: ${Object.values(testResults.environments).filter(env => env.scriptExists).length}/3`);
console.log(`🔒 حالة الأمان: ${testResults.security.portSeparation.status === '✅ منفصل' && testResults.security.databaseSeparation.status === '✅ منفصل' ? '✅ آمن' : '⚠️ يحتاج مراجعة'}`);

if (successRate >= 90) {
  console.log('\n🎉 ممتاز! النظام جاهز للاستخدام الآمن');
} else if (successRate >= 70) {
  console.log('\n⚠️ جيد، لكن يحتاج بعض التحسينات');
} else {
  console.log('\n🚨 يحتاج إصلاحات عاجلة قبل الاستخدام');
}

console.log('\n📋 للمراجعة التفصيلية، راجع الملف:', reportFile);