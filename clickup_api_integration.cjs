/**
 * 🔗 ClickUp API Integration - تكامل فعلي مع ClickUp
 * يحدث المهام في ClickUp مباشرة عبر API
 */

const https = require('https');
const fs = require('fs');

// إعدادات ClickUp API
const CLICKUP_CONFIG = {
  // يجب الحصول على هذه القيم من ClickUp
  API_TOKEN: 'YOUR_CLICKUP_API_TOKEN', // من ClickUp Settings > Apps
  TEAM_ID: 'YOUR_TEAM_ID',            // معرف الفريق
  SPACE_ID: 'YOUR_SPACE_ID',          // معرف مساحة العمل
  LIST_ID: 'YOUR_LIST_ID',            // معرف القائمة
  API_URL: 'https://api.clickup.com/api/v2'
};

console.log('🔗 === تكامل ClickUp API المباشر ===\n');

/**
 * إجراء طلب HTTP إلى ClickUp API
 */
function makeClickUpRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.clickup.com',
      port: 443,
      path: `/api/v2${endpoint}`,
      method: method,
      headers: {
        'Authorization': CLICKUP_CONFIG.API_TOKEN,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const jsonData = JSON.parse(responseData);
            resolve(jsonData);
          } catch (error) {
            resolve(responseData);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * إنشاء مهمة جديدة في ClickUp
 */
async function createTask(taskData) {
  console.log(`📝 إنشاء مهمة: ${taskData.name}`);
  
  const payload = {
    name: taskData.name,
    description: taskData.description,
    status: taskData.status || 'to do',
    priority: taskData.priority || 3, // 1=urgent, 2=high, 3=normal, 4=low
    due_date: taskData.dueDate ? new Date(taskData.dueDate).getTime() : null,
    time_estimate: taskData.timeEstimate ? taskData.timeEstimate * 3600000 : null, // hours to milliseconds
    tags: taskData.tags || [],
    assignees: taskData.assignees || []
  };

  try {
    const result = await makeClickUpRequest('POST', `/list/${CLICKUP_CONFIG.LIST_ID}/task`, payload);
    console.log(`   ✅ تم إنشاء المهمة - ID: ${result.id}`);
    return result;
  } catch (error) {
    console.error(`   ❌ فشل إنشاء المهمة: ${error.message}`);
    return null;
  }
}

/**
 * تحديث حالة مهمة موجودة
 */
async function updateTaskStatus(taskId, newStatus, updateData = {}) {
  console.log(`🔄 تحديث المهمة ${taskId} إلى: ${newStatus}`);
  
  try {
    // تحديث الحالة
    await makeClickUpRequest('PUT', `/task/${taskId}`, {
      status: newStatus,
      ...updateData
    });
    
    console.log(`   ✅ تم تحديث الحالة بنجاح`);
    return true;
  } catch (error) {
    console.error(`   ❌ فشل تحديث الحالة: ${error.message}`);
    return false;
  }
}

/**
 * البحث عن المهام الموجودة
 */
async function getExistingTasks() {
  console.log('🔍 جلب المهام الموجودة...');
  
  try {
    const result = await makeClickUpRequest('GET', `/list/${CLICKUP_CONFIG.LIST_ID}/task`);
    console.log(`   📋 وُجد ${result.tasks ? result.tasks.length : 0} مهمة`);
    return result.tasks || [];
  } catch (error) {
    console.error(`   ❌ فشل جلب المهام: ${error.message}`);
    return [];
  }
}

/**
 * مزامنة المهام من التحليل المحلي إلى ClickUp
 */
async function syncTasksToClickUp() {
  console.log('🔄 بدء مزامنة المهام مع ClickUp...\n');

  // قراءة تقرير التحليل
  let analysisReport;
  try {
    const reportContent = fs.readFileSync('DETAILED_FEATURE_ANALYSIS.json', 'utf8');
    analysisReport = JSON.parse(reportContent);
  } catch (error) {
    console.error('❌ لا يمكن قراءة تقرير التحليل');
    return false;
  }

  // جلب المهام الموجودة
  const existingTasks = await getExistingTasks();
  
  // تحضير المهام للمزامنة
  const tasksToSync = [
    {
      name: 'نظام إدارة الطلاب الكامل',
      description: 'إضافة، تعديل، حذف، بحث، رفع Excel - مكتمل 100%',
      status: 'complete',
      priority: 2,
      tags: ['student-management', 'completed', 'verified'],
      progress: analysisReport.evaluation.scores.studentManagement
    },
    {
      name: 'نظام الحضور المتقدم',
      description: 'تسجيل فردي، جماعي، استثناءات، حفظ في قاعدة البيانات - 100%',
      status: 'complete',
      priority: 2,
      tags: ['attendance', 'completed', 'verified'],
      progress: 100
    },
    {
      name: 'Backend API للحضور',
      description: 'مسارات POST, GET, DELETE مع معالجة الأخطاء والتحقق - 89%',
      status: analysisReport.evaluation.scores.attendance >= 90 ? 'complete' : 'in progress',
      priority: 2,
      tags: ['backend', 'api', 'attendance'],
      progress: analysisReport.evaluation.scores.attendance
    },
    {
      name: 'تحسين العلاقات في نماذج البيانات',
      description: 'إضافة العلاقات بين الجداول - يحتاج عمل',
      status: 'to do',
      priority: 3,
      tags: ['database', 'models', 'relationships'],
      progress: analysisReport.evaluation.scores.dataModels
    },
    {
      name: 'نظام التقارير والإحصائيات',
      description: 'تطوير تقارير شاملة ولوحة قيادة',
      status: 'to do',
      priority: 2,
      tags: ['reporting', 'analytics', 'dashboard'],
      progress: 0
    }
  ];

  // مزامنة كل مهمة
  let syncedCount = 0;
  for (const task of tasksToSync) {
    // البحث عن مهمة مشابهة موجودة
    const existingTask = existingTasks.find(t => 
      t.name.toLowerCase().includes(task.name.split(' ')[0].toLowerCase())
    );

    if (existingTask) {
      // تحديث المهمة الموجودة
      const updated = await updateTaskStatus(existingTask.id, task.status, {
        description: task.description,
        priority: task.priority
      });
      if (updated) syncedCount++;
    } else {
      // إنشاء مهمة جديدة
      const created = await createTask(task);
      if (created) syncedCount++;
    }
    
    // انتظار قصير لتجنب rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n🎉 تمت مزامنة ${syncedCount}/${tasksToSync.length} مهمة بنجاح!`);
  return syncedCount === tasksToSync.length;
}

/**
 * إعداد webhook لتحديثات تلقائية
 */
function setupAutoSync() {
  console.log('⚙️ إعداد المزامنة التلقائية...');
  
  // مزامنة كل ساعة
  setInterval(async () => {
    console.log('\n🔄 تشغيل المزامنة التلقائية...');
    await syncTasksToClickUp();
  }, 60 * 60 * 1000); // كل ساعة

  console.log('✅ تم تفعيل المزامنة التلقائية (كل ساعة)');
}

/**
 * إنشاء ملف إعداد ClickUp
 */
function createClickUpSetupGuide() {
  const setupGuide = `# 🔗 دليل إعداد تكامل ClickUp API

## 📋 المتطلبات:

### 1. الحصول على API Token:
1. اذهب إلى ClickUp Settings
2. اضغط على "Apps" 
3. اضغط على "API"
4. انسخ "Personal API Token"

### 2. الحصول على معرفات المشروع:
\`\`\`bash
# احصل على معرف الفريق
curl -H "Authorization: YOUR_TOKEN" https://api.clickup.com/api/v2/team

# احصل على معرف المساحة  
curl -H "Authorization: YOUR_TOKEN" https://api.clickup.com/api/v2/team/TEAM_ID/space

# احصل على معرف القائمة
curl -H "Authorization: YOUR_TOKEN" https://api.clickup.com/api/v2/space/SPACE_ID/list
\`\`\`

## 🔧 خطوات التفعيل:

### 1. تحديث ملف الإعدادات:
\`\`\`javascript
const CLICKUP_CONFIG = {
  API_TOKEN: 'pk_YOUR_ACTUAL_TOKEN_HERE',
  TEAM_ID: '1234567',
  SPACE_ID: '7654321', 
  LIST_ID: '9876543'
};
\`\`\`

### 2. تشغيل المزامنة:
\`\`\`bash
node clickup_api_integration.cjs
\`\`\`

### 3. تفعيل المزامنة التلقائية:
\`\`\`bash
node clickup_api_integration.cjs --auto-sync
\`\`\`

## ⚡ الميزات:
- ✅ إنشاء مهام جديدة تلقائياً
- 🔄 تحديث حالة المهام الموجودة  
- 📊 مزامنة نسب التقدم
- 🏷️ إضافة تاغز وأولويات
- ⏰ مزامنة تلقائية كل ساعة

## 🚨 ملاحظات الأمان:
- لا تشارك API Token مع أحد
- احفظ النسخة الاحتياطية من الإعدادات
- استخدم متغيرات البيئة للإنتاج

---
*تم إنشاء هذا الدليل تلقائياً* 📖
`;

  fs.writeFileSync('CLICKUP_API_SETUP_GUIDE.md', setupGuide);
  console.log('📖 تم إنشاء دليل الإعداد: CLICKUP_API_SETUP_GUIDE.md');
}

/**
 * وضع التجربة (بدون API فعلي)
 */
async function demoMode() {
  console.log('🎭 === وضع التجربة (Demo Mode) ===');
  console.log('⚠️  لتفعيل التحديث الفعلي، أضف API Token صحيح\n');
  
  // محاكاة العمليات
  console.log('📝 محاكاة إنشاء المهام...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('   ✅ [محاكاة] تم إنشاء 5 مهام');
  
  console.log('🔄 محاكاة تحديث الحالات...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('   ✅ [محاكاة] تم تحديث 3 حالات');
  
  console.log('🔗 محاكاة المزامنة...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('   ✅ [محاكاة] تمت المزامنة بنجاح');
  
  console.log('\n💡 لتفعيل التحديث الحقيقي:');
  console.log('   1. احصل على ClickUp API Token');
  console.log('   2. أضف المعرفات في CLICKUP_CONFIG');
  console.log('   3. شغل: node clickup_api_integration.cjs --real');
}

// تشغيل الأداة
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
🔗 ClickUp API Integration Tool

Usage:
  node clickup_api_integration.cjs [options]

Options:
  --demo        تشغيل وضع التجربة (افتراضي)
  --real        تشغيل المزامنة الحقيقية (يحتاج API Token)
  --setup       إنشاء دليل الإعداد فقط
  --auto-sync   تفعيل المزامنة التلقائية
  --help        عرض هذه المساعدة
    `);
    return;
  }

  if (args.includes('--setup')) {
    createClickUpSetupGuide();
    return;
  }

  // فحص إعدادات API
  const hasValidToken = CLICKUP_CONFIG.API_TOKEN && 
                       !CLICKUP_CONFIG.API_TOKEN.includes('YOUR_');

  if (args.includes('--real') && hasValidToken) {
    console.log('🚀 تشغيل المزامنة الحقيقية...\n');
    const success = await syncTasksToClickUp();
    
    if (success && args.includes('--auto-sync')) {
      setupAutoSync();
      console.log('🔄 الأداة تعمل في الخلفية...');
      // إبقاء العملية تعمل
      process.stdin.resume();
    }
  } else {
    await demoMode();
    createClickUpSetupGuide();
  }
}

// تشغيل الأداة
if (require.main === module) {
  main().catch(error => {
    console.error('❌ خطأ في التشغيل:', error.message);
    process.exit(1);
  });
}

module.exports = { 
  syncTasksToClickUp, 
  createTask, 
  updateTaskStatus,
  makeClickUpRequest 
};