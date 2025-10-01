/**
 * 🎯 مدير المهام التفاعلي - Interactive Task Manager
 * يساعدك في اختيار المهمة التالية وبدء العمل عليها
 */

const fs = require('fs');

console.log('🎯 === مدير المهام التفاعلي ===\n');

// قائمة المهام المتاحة بالأولوية
const availableTasks = {
  1: {
    name: 'إكمال Backend API للحضور',
    description: 'إضافة مسار UPDATE وتحسين معالجة الأخطاء',
    currentProgress: 89,
    targetProgress: 95,
    timeEstimate: '2-3 ساعات',
    difficulty: 'متوسط',
    files: ['backend/routes/attendance.js'],
    steps: [
      'إضافة router.put للتحديث',
      'تحسين معالجة الأخطاء',
      'إضافة تحقق من البيانات',
      'اختبار الـ API الجديد'
    ],
    priority: 'عالية',
    impact: 'يكمل نظام الحضور بالكامل'
  },

  2: {
    name: 'تطوير تقارير الحضور المتقدمة',
    description: 'إضافة إحصائيات وتصدير للتقارير',
    currentProgress: 50,
    targetProgress: 90,
    timeEstimate: '3-4 ساعات',
    difficulty: 'متوسط إلى صعب',
    files: [
      'src/components/AbsenceHistoryContent.tsx',
      'src/components/AttendanceReports.tsx'
    ],
    steps: [
      'إضافة إحصائيات متقدمة',
      'تطوير تقارير أسبوعية/شهرية',
      'إضافة تصدير PDF/Excel',
      'تحسين واجهات التقارير'
    ],
    priority: 'عالية',
    impact: 'تقارير شاملة للمعلمين والإدارة'
  },

  3: {
    name: 'بدء نظام إدارة الدرجات',
    description: 'إنشاء نظام كامل لإدارة درجات الطلاب',
    currentProgress: 0,
    targetProgress: 60,
    timeEstimate: '4-6 ساعات',
    difficulty: 'متوسط إلى صعب',
    files: [
      'backend/models/grade.js',
      'backend/routes/grades.js',
      'src/pages/GradeManagement.tsx',
      'src/components/GradeEntry.tsx'
    ],
    steps: [
      'إنشاء نماذج قاعدة البيانات',
      'تطوير مسارات API',
      'إنشاء واجهات إدخال الدرجات',
      'تطوير حساب المعدلات التلقائي',
      'إضافة تقارير الأداء'
    ],
    priority: 'متوسطة',
    impact: 'ميزة جديدة كاملة للنظام'
  },

  4: {
    name: 'تحسين العلاقات في نماذج البيانات',
    description: 'إضافة العلاقات المفقودة بين الجداول',
    currentProgress: 73,
    targetProgress: 90,
    timeEstimate: '2-3 ساعات',
    difficulty: 'سهل إلى متوسط',
    files: [
      'backend/models/index.js',
      'backend/models/student.js',
      'backend/models/attendance.js',
      'backend/models/section.js'
    ],
    steps: [
      'إضافة belongsTo و hasMany في النماذج',
      'تحديث ملف index.js للعلاقات',
      'اختبار العلاقات الجديدة',
      'تحديث الاستعلامات لاستخدام العلاقات'
    ],
    priority: 'متوسطة',
    impact: 'تحسين أداء قاعدة البيانات والاستعلامات'
  }
};

/**
 * عرض المهام المتاحة
 */
function displayAvailableTasks() {
  console.log('📋 المهام المتاحة للعمل عليها:\n');

  Object.entries(availableTasks).forEach(([num, task]) => {
    const progressBar = '█'.repeat(Math.floor(task.currentProgress / 10)) + 
                       '░'.repeat(10 - Math.floor(task.currentProgress / 10));
    
    const priorityIcon = task.priority === 'عالية' ? '🔥' : 
                        task.priority === 'متوسطة' ? '⚡' : '📝';

    console.log(`${priorityIcon} **${num}. ${task.name}**`);
    console.log(`   📝 ${task.description}`);
    console.log(`   📊 التقدم: [${progressBar}] ${task.currentProgress}% → ${task.targetProgress}%`);
    console.log(`   ⏰ الوقت المقدر: ${task.timeEstimate}`);
    console.log(`   🎯 الصعوبة: ${task.difficulty}`);
    console.log(`   💡 التأثير: ${task.impact}\n`);
  });
}

/**
 * عرض تفاصيل مهمة محددة
 */
function displayTaskDetails(taskNum) {
  const task = availableTasks[taskNum];
  if (!task) {
    console.log('❌ رقم المهمة غير صحيح!');
    return;
  }

  console.log(`🎯 === تفاصيل المهمة: ${task.name} ===\n`);
  console.log(`📝 الوصف: ${task.description}`);
  console.log(`📊 التقدم الحالي: ${task.currentProgress}%`);
  console.log(`🎯 الهدف: ${task.targetProgress}%`);
  console.log(`⏰ الوقت المقدر: ${task.timeEstimate}`);
  console.log(`🎪 الصعوبة: ${task.difficulty}`);
  console.log(`🔥 الأولوية: ${task.priority}`);
  console.log(`💡 التأثير: ${task.impact}\n`);

  console.log(`📁 الملفات المطلوبة:`);
  task.files.forEach(file => {
    const exists = fs.existsSync(file) ? '✅' : '❌';
    console.log(`   ${exists} ${file}`);
  });

  console.log(`\n📋 خطوات العمل:`);
  task.steps.forEach((step, i) => {
    console.log(`   ${i + 1}. ${step}`);
  });

  console.log('\n🚀 هل تريد بدء هذه المهمة؟');
}

/**
 * إنشاء خطة عمل لمهمة
 */
function createWorkPlan(taskNum) {
  const task = availableTasks[taskNum];
  if (!task) return;

  const workPlan = `# 🎯 خطة العمل: ${task.name}

## 📊 معلومات المهمة
- **الوصف**: ${task.description}
- **التقدم الحالي**: ${task.currentProgress}%
- **الهدف**: ${task.targetProgress}%
- **الوقت المقدر**: ${task.timeEstimate}
- **الأولوية**: ${task.priority}

## 📁 الملفات المطلوبة
${task.files.map(file => `- [ ] ${file}`).join('\n')}

## 📋 خطوات التنفيذ
${task.steps.map((step, i) => `${i + 1}. [ ] ${step}`).join('\n')}

## ✅ معايير الإكمال
- جميع الخطوات مكتملة
- الاختبارات تعمل بنجاح
- الكود محفوظ في Git
- التوثيق محدث

## 🎯 المخرجات المتوقعة
- **تحسين التقدم**: ${task.currentProgress}% → ${task.targetProgress}%
- **التأثير**: ${task.impact}

---
تاريخ البداية: ${new Date().toISOString().slice(0,10)}
تاريخ الإكمال المتوقع: ${new Date(Date.now() + 24*60*60*1000).toISOString().slice(0,10)}
`;

  const fileName = `WORK_PLAN_${taskNum}_${task.name.replace(/\s+/g, '_')}.md`;
  fs.writeFileSync(fileName, workPlan);
  console.log(`📋 تم إنشاء خطة العمل: ${fileName}`);
  
  return fileName;
}

/**
 * بدء العمل على مهمة
 */
function startTask(taskNum) {
  console.log(`🚀 بدء العمل على المهمة ${taskNum}...\n`);
  
  displayTaskDetails(taskNum);
  const planFile = createWorkPlan(taskNum);
  
  console.log('\n📝 الخطوات التالية:');
  console.log('1. راجع خطة العمل المُنشأة');
  console.log('2. أعدّ الملفات المطلوبة');
  console.log('3. ابدأ تنفيذ الخطوات واحدة تلو الأخرى');
  console.log('4. سأساعدك في كل خطوة');
  
  console.log(`\n💡 لبدء الخطوة الأولى، قل: "ابدأ الخطوة 1 من المهمة ${taskNum}"`);
}

// عرض المهام عند التشغيل
displayAvailableTasks();

console.log('💬 اختر رقم المهمة (1-4) أو اكتب "تفاصيل [رقم]" لرؤية التفاصيل');
console.log('🚀 مثال: "ابدأ المهمة 1" أو "تفاصيل 2"');

module.exports = { 
  availableTasks, 
  displayTaskDetails, 
  startTask, 
  createWorkPlan 
};