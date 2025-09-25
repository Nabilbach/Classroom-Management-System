#!/usr/bin/env node
// 🗂️ مُحلل مسارات قاعدة البيانات - تتبع تدفق البيانات بالتفصيل
// Database Flow Analyzer - Comprehensive Data Flow Tracker

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🗂️ مُحلل مسارات قاعدة البيانات');
console.log('='.repeat(60));

const analysis = {
  timestamp: new Date().toISOString(),
  databases: {},
  connections: {
    direct: [],      // اتصالات مباشرة بـ SQLite
    orm: [],         // اتصالات عبر Sequelize
    api: [],         // اتصالات عبر API
    scripts: []      // سكريبتات الصيانة
  },
  flows: {},         // مسارات تدفق البيانات
  risks: [],         // المخاطر المكتشفة
  recommendations: [] // التوصيات
};

// 1️⃣ تحليل قواعد البيانات الموجودة
console.log('\n1️⃣ فحص قواعد البيانات...');

const dbFiles = [
  'classroom.db',
  'classroom_dev.db', 
  'classroom_test.db',
  'classroom_backup_20250924_174347.db',
  'classroom_backup_2.db'
];

dbFiles.forEach(dbFile => {
  try {
    if (fs.existsSync(dbFile)) {
      const stats = fs.statSync(dbFile);
      const sizeKB = Math.round(stats.size / 1024);
      
      analysis.databases[dbFile] = {
        exists: true,
        size: sizeKB,
        lastModified: stats.mtime.toISOString(),
        type: dbFile.includes('dev') ? 'development' : 
              dbFile.includes('test') ? 'testing' :
              dbFile.includes('backup') ? 'backup' : 'production'
      };
      
      console.log(`   📁 ${dbFile}: ${sizeKB} KB (${analysis.databases[dbFile].type})`);
    } else {
      analysis.databases[dbFile] = { exists: false };
      console.log(`   ❌ ${dbFile}: مفقود`);
    }
  } catch (error) {
    analysis.databases[dbFile] = { exists: false, error: error.message };
    console.log(`   ❌ ${dbFile}: خطأ - ${error.message}`);
  }
});

// 2️⃣ تحليل الاتصالات المباشرة
console.log('\n2️⃣ تحليل الاتصالات المباشرة...');

function scanDirectConnections(directory = '.') {
  const files = fs.readdirSync(directory);
  
  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      scanDirectConnections(filePath);
    } else if (file.endsWith('.js') || file.endsWith('.cjs') || file.endsWith('.ts')) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // البحث عن اتصالات SQLite مباشرة
        if (content.includes('sqlite3') && content.includes('Database')) {
          const dbMatches = content.match(/new sqlite3\.Database\(['"`]([^'"`]+)['"`]/g);
          if (dbMatches) {
            dbMatches.forEach(match => {
              const dbPath = match.match(/['"`]([^'"`]+)['"`]/)[1];
              analysis.connections.direct.push({
                file: filePath,
                database: dbPath,
                type: 'sqlite3-direct',
                operations: {
                  read: content.includes('.all(') || content.includes('.get('),
                  write: content.includes('.run(') || content.includes('INSERT') || content.includes('UPDATE'),
                  structure: content.includes('CREATE TABLE') || content.includes('ALTER TABLE')
                }
              });
            });
          }
        }
        
        // البحث عن اتصالات Sequelize
        if (content.includes('sequelize') || content.includes('Sequelize')) {
          analysis.connections.orm.push({
            file: filePath,
            type: 'sequelize-orm',
            models: content.match(/\b(Section|Lesson|Student|Attendance)\b/g) || []
          });
        }
        
        // البحث عن استدعاءات API
        if (content.includes('localhost:') || content.includes('API_BASE_URL')) {
          const portMatches = content.match(/localhost:(\d+)/g);
          if (portMatches) {
            portMatches.forEach(portMatch => {
              const port = portMatch.split(':')[1];
              analysis.connections.api.push({
                file: filePath,
                port: parseInt(port),
                type: 'api-client'
              });
            });
          }
        }
        
      } catch (error) {
        // تجاهل الأخطاء في قراءة الملفات
      }
    }
  });
}

scanDirectConnections();

console.log(`   📊 اتصالات مباشرة: ${analysis.connections.direct.length}`);
console.log(`   🔗 اتصالات ORM: ${analysis.connections.orm.length}`);
console.log(`   🌐 اتصالات API: ${analysis.connections.api.length}`);

// 3️⃣ تحليل مسارات التدفق
console.log('\n3️⃣ تحليل مسارات التدفق...');

// تجميع البيانات حسب قاعدة البيانات
Object.keys(analysis.databases).forEach(dbName => {
  if (analysis.databases[dbName].exists) {
    analysis.flows[dbName] = {
      readers: analysis.connections.direct.filter(conn => 
        conn.database.includes(dbName.replace('.db', '')) && conn.operations.read
      ).length,
      writers: analysis.connections.direct.filter(conn => 
        conn.database.includes(dbName.replace('.db', '')) && conn.operations.write
      ).length,
      modifiers: analysis.connections.direct.filter(conn => 
        conn.database.includes(dbName.replace('.db', '')) && conn.operations.structure
      ).length
    };
    
    console.log(`   📁 ${dbName}:`);
    console.log(`      📖 قراء: ${analysis.flows[dbName].readers}`);
    console.log(`      ✏️ كُتاب: ${analysis.flows[dbName].writers}`);
    console.log(`      🔧 مُعدلات: ${analysis.flows[dbName].modifiers}`);
  }
});

// 4️⃣ تحليل المخاطر
console.log('\n4️⃣ تحليل المخاطر...');

// فحص الاتصالات المتعددة لنفس قاعدة البيانات
const productionWriters = analysis.connections.direct.filter(conn => 
  conn.database.includes('classroom.db') && conn.operations.write
);

if (productionWriters.length > 5) {
  analysis.risks.push({
    type: 'multiple-writers',
    severity: 'high',
    description: `${productionWriters.length} ملف يكتب في قاعدة الإنتاج مباشرة`,
    files: productionWriters.map(w => w.file)
  });
}

// فحص المنافذ المتضاربة
const apiPorts = [...new Set(analysis.connections.api.map(conn => conn.port))];
if (apiPorts.length > 3) {
  analysis.risks.push({
    type: 'port-confusion',
    severity: 'medium',
    description: `استخدام ${apiPorts.length} منافذ مختلفة: ${apiPorts.join(', ')}`,
    ports: apiPorts
  });
}

// فحص الاتصالات غير المحمية
const unprotectedConnections = analysis.connections.direct.filter(conn => {
  try {
    const content = fs.readFileSync(conn.file, 'utf8');
    return conn.operations.write && !content.includes('BEGIN TRANSACTION') && !content.includes('serialize');
  } catch {
    return false;
  }
});

if (unprotectedConnections.length > 0) {
  analysis.risks.push({
    type: 'unprotected-writes',
    severity: 'high',
    description: `${unprotectedConnections.length} اتصال كتابة غير محمي`,
    files: unprotectedConnections.map(c => c.file)
  });
}

analysis.risks.forEach(risk => {
  const icon = risk.severity === 'high' ? '🚨' : risk.severity === 'medium' ? '⚠️' : 'ℹ️';
  console.log(`   ${icon} ${risk.description}`);
});

// 5️⃣ توليد التوصيات
console.log('\n5️⃣ توليد التوصيات...');

if (analysis.risks.some(r => r.type === 'multiple-writers')) {
  analysis.recommendations.push({
    priority: 'urgent',
    action: 'إنشاء مدير اتصال موحد',
    description: 'توحيد جميع عمليات الكتابة تحت مدير واحد لتجنب التضارب'
  });
}

if (analysis.risks.some(r => r.type === 'unprotected-writes')) {
  analysis.recommendations.push({
    priority: 'urgent', 
    action: 'إضافة حماية المعاملات',
    description: 'تطبيق transactions في جميع عمليات الكتابة لضمان سلامة البيانات'
  });
}

if (analysis.risks.some(r => r.type === 'port-confusion')) {
  analysis.recommendations.push({
    priority: 'medium',
    action: 'توحيد منافذ API',
    description: 'تجميع جميع خدمات API تحت منفذ موحد لكل بيئة'
  });
}

// إضافة توصيات إضافية
analysis.recommendations.push({
  priority: 'high',
  action: 'إصلاح التكوين الثابت',
  description: 'تعديل backend/config/database.js ليستخدم متغيرات البيئة'
});

analysis.recommendations.push({
  priority: 'medium',
  action: 'إنشاء نظام مراقبة',
  description: 'تطبيق مراقبة مستمرة لجميع اتصالات قاعدة البيانات'
});

analysis.recommendations.forEach(rec => {
  const icon = rec.priority === 'urgent' ? '🚨' : rec.priority === 'high' ? '⚠️' : 'ℹ️';
  console.log(`   ${icon} ${rec.action}: ${rec.description}`);
});

// 6️⃣ حفظ التقرير التفصيلي
console.log('\n6️⃣ حفظ التقرير...');

const reportFile = `database_flow_analysis_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
fs.writeFileSync(reportFile, JSON.stringify(analysis, null, 2));

// إنشاء ملخص مرئي
const summaryReport = `
# 🗂️ ملخص تحليل مسارات قاعدة البيانات

## 📊 الإحصائيات الشاملة

### قواعد البيانات:
${Object.entries(analysis.databases).map(([name, info]) => 
  `- ${name}: ${info.exists ? `${info.size} KB (${info.type})` : 'مفقود'}`
).join('\n')}

### الاتصالات:
- 🔗 اتصالات مباشرة: ${analysis.connections.direct.length}
- 🏗️ اتصالات ORM: ${analysis.connections.orm.length}  
- 🌐 اتصالات API: ${analysis.connections.api.length}

### المخاطر:
${analysis.risks.map(risk => `- ${risk.severity === 'high' ? '🚨' : '⚠️'} ${risk.description}`).join('\n')}

### التوصيات العاجلة:
${analysis.recommendations.filter(r => r.priority === 'urgent').map(rec => `- 🚨 ${rec.action}`).join('\n')}

---

## 🎯 الإجراءات المطلوبة

1. **فوري**: إصلاح التكوين الثابت في database.js
2. **عاجل**: إضافة حماية transactions لجميع عمليات الكتابة  
3. **مهم**: توحيد مدير الاتصالات
4. **مفيد**: إنشاء نظام مراقبة شامل

**ملف التقرير التفصيلي**: ${reportFile}

*تاريخ التحليل: ${new Date().toLocaleString('ar-SA')}*
`;

fs.writeFileSync('DATABASE_FLOW_SUMMARY.md', summaryReport);

console.log(`   📋 تم حفظ التقرير التفصيلي: ${reportFile}`);
console.log(`   📄 تم حفظ الملخص: DATABASE_FLOW_SUMMARY.md`);

// 7️⃣ ملخص نهائي
console.log('\n' + '='.repeat(60));
console.log('📋 ملخص التحليل:');
console.log('='.repeat(60));

console.log(`🗃️ قواعد البيانات المكتشفة: ${Object.keys(analysis.databases).length}`);
console.log(`🔗 إجمالي نقاط الاتصال: ${analysis.connections.direct.length + analysis.connections.orm.length + analysis.connections.api.length}`);
console.log(`⚠️ المخاطر المكتشفة: ${analysis.risks.length}`);
console.log(`💡 التوصيات: ${analysis.recommendations.length}`);

const urgentRecommendations = analysis.recommendations.filter(r => r.priority === 'urgent').length;
const highRisks = analysis.risks.filter(r => r.severity === 'high').length;

if (highRisks > 0 || urgentRecommendations > 0) {
  console.log('\n🚨 تحذير: يتطلب النظام إجراءات عاجلة لضمان أمان البيانات!');
} else {
  console.log('\n✅ النظام في حالة مقبولة مع بعض التحسينات المطلوبة');
}

console.log('\n📖 للمراجعة التفصيلية:');
console.log(`   - التقرير الشامل: DATABASE_CONNECTION_MAP.md`);
console.log(`   - البيانات التفصيلية: ${reportFile}`);
console.log(`   - الملخص التنفيذي: DATABASE_FLOW_SUMMARY.md`);