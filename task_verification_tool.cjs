#!/usr/bin/env node
/**
 * 🔍 أداة التحقق من حالة المهام - Task Status Verification Tool
 * تتحقق من حالة المهام المدرجة في ClickUp مقابل الكود الفعلي
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 === أداة التحقق من حالة المهام === \n');

// قائمة المهام المدعى إكمالها
const CLAIMED_COMPLETED_TASKS = [
  {
    name: 'نظام تسجيل الحضور',
    description: 'تطوير واجهات تسجيل الحضور الفردي والجماعي',
    checkFiles: ['src/pages/StudentManagement.tsx', 'src/components/AttendanceTracker.tsx'],
    checkCode: ['isAttendanceMode', 'handleToggleAttendance', 'attendanceStatus'],
    status: 'Complete'
  },
  {
    name: 'أزرار الحضور المتقدمة',
    description: 'تطبيق أزرار تعيين الكل حاضر/غائب مع الاستثناءات',
    checkFiles: ['src/pages/StudentManagement.tsx'],
    checkCode: ['handleMarkAllPresent', 'handleMarkAllAbsent', 'handleMarkAllPresentExcept', 'handleMarkAllAbsentExcept'],
    status: 'Complete'
  },
  {
    name: 'حفظ بيانات الحضور',
    description: 'ربط واجهات الحضور بقاعدة البيانات وحفظ البيانات',
    checkFiles: ['backend/routes/attendance.js', 'src/pages/StudentManagement.tsx'],
    checkCode: ['handleSaveAttendance', '/api/attendance', 'POST'],
    status: 'Complete'
  },
  {
    name: 'نظام إدارة الطلاب',
    description: 'تطوير واجهات إضافة وتعديل وحذف الطلاب',
    checkFiles: ['src/pages/StudentManagement.tsx', 'backend/routes/students.js'],
    checkCode: ['handleEditStudent', 'handleDeleteStudent', 'addStudent'],
    status: 'Complete'
  },
  {
    name: 'نظام إدارة الأقسام',
    description: 'إنشاء واجهات وآليات إدارة الأقسام الدراسية',
    checkFiles: ['src/contexts/SectionsContext.tsx', 'backend/models/section.js'],
    checkCode: ['useSections', 'currentSection', 'Section'],
    status: 'Complete'
  }
];

// المهام المدعى أنها قيد التطوير
const CLAIMED_IN_PROGRESS_TASKS = [
  {
    name: 'تقارير الحضور الأساسية',
    description: 'إنشاء تقارير بسيطة لحضور الطلاب',
    checkFiles: ['src/components/AbsenceHistoryContent.tsx'],
    checkCode: ['AbsenceHistory', 'attendance report', 'togglePresence'],
    status: 'In Progress'
  },
  {
    name: 'نظام قوالب الدروس',
    description: 'تطوير نظام إنشاء وإدارة قوالب الدروس',
    checkFiles: ['src/pages/LearningManagement.tsx', 'backend/models/lessonTemplate.js'],
    checkCode: ['LessonTemplate', 'template', 'curriculum'],
    status: 'In Progress'
  }
];

/**
 * فحص وجود ملف
 */
function checkFileExists(filePath) {
  const fullPath = path.resolve(filePath);
  return fs.existsSync(fullPath);
}

/**
 * فحص وجود كود معين في ملف
 */
function checkCodeInFile(filePath, codePatterns) {
  if (!checkFileExists(filePath)) return false;
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return codePatterns.every(pattern => content.includes(pattern));
  } catch (error) {
    console.error(`❌ خطأ في قراءة الملف ${filePath}:`, error.message);
    return false;
  }
}

/**
 * التحقق من مهمة واحدة
 */
function verifyTask(task) {
  console.log(`\n🔍 التحقق من: ${task.name}`);
  console.log(`📝 الوصف: ${task.description}`);
  console.log(`📊 الحالة المدعاة: ${task.status}`);
  
  let filesFound = 0;
  let codeFound = 0;
  
  // فحص الملفات
  console.log('📁 فحص الملفات:');
  task.checkFiles.forEach(file => {
    const exists = checkFileExists(file);
    console.log(`  ${exists ? '✅' : '❌'} ${file}`);
    if (exists) filesFound++;
  });
  
  // فحص الكود
  console.log('🔧 فحص الكود:');
  task.checkFiles.forEach(file => {
    if (checkFileExists(file)) {
      const hasCode = checkCodeInFile(file, task.checkCode);
      console.log(`  ${hasCode ? '✅' : '❌'} ${file} - الكود المطلوب`);
      if (hasCode) codeFound++;
    }
  });
  
  // تقييم النتيجة
  const filesScore = filesFound / task.checkFiles.length;
  const codeScore = codeFound / task.checkFiles.length;
  const overallScore = (filesScore + codeScore) / 2;
  
  let actualStatus = 'Not Started';
  if (overallScore >= 0.9) {
    actualStatus = 'Complete';
  } else if (overallScore >= 0.5) {
    actualStatus = 'In Progress';
  } else if (overallScore > 0) {
    actualStatus = 'Started';
  }
  
  const statusMatch = actualStatus === task.status;
  
  console.log(`📊 النتيجة: ${Math.round(overallScore * 100)}%`);
  console.log(`🎯 الحالة الفعلية: ${actualStatus}`);
  console.log(`${statusMatch ? '✅' : '⚠️'} ${statusMatch ? 'متطابقة' : 'غير متطابقة'} مع الحالة المدعاة`);
  
  return {
    name: task.name,
    claimed: task.status,
    actual: actualStatus,
    score: Math.round(overallScore * 100),
    match: statusMatch
  };
}

/**
 * إنشاء تقرير شامل
 */
function generateReport(results) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 === تقرير التحقق النهائي ===');
  console.log('='.repeat(60));
  
  const totalTasks = results.length;
  const matchingTasks = results.filter(r => r.match).length;
  const accuracy = Math.round((matchingTasks / totalTasks) * 100);
  
  console.log(`\n📈 الإحصائيات العامة:`);
  console.log(`   إجمالي المهام المفحوصة: ${totalTasks}`);
  console.log(`   المهام المتطابقة: ${matchingTasks}`);
  console.log(`   دقة التطابق: ${accuracy}%`);
  
  console.log(`\n📋 تفاصيل النتائج:`);
  results.forEach(result => {
    const icon = result.match ? '✅' : '⚠️';
    console.log(`   ${icon} ${result.name}`);
    console.log(`      المدعاة: ${result.claimed} | الفعلية: ${result.actual} | النسبة: ${result.score}%`);
  });
  
  console.log(`\n🎯 التوصيات:`);
  
  const incompleteComplete = results.filter(r => r.claimed === 'Complete' && r.actual !== 'Complete');
  if (incompleteComplete.length > 0) {
    console.log(`   ⚠️ مهام مدعى اكتمالها لكنها غير مكتملة:`);
    incompleteComplete.forEach(task => {
      console.log(`      - ${task.name} (${task.score}%)`);
    });
  }
  
  const wrongProgress = results.filter(r => r.claimed === 'In Progress' && r.actual === 'Complete');
  if (wrongProgress.length > 0) {
    console.log(`   ✅ مهام يجب تحديث حالتها إلى مكتملة:`);
    wrongProgress.forEach(task => {
      console.log(`      - ${task.name} (${task.score}%)`);
    });
  }
  
  return {
    totalTasks,
    matchingTasks,
    accuracy,
    recommendations: {
      incompleteComplete,
      wrongProgress
    }
  };
}

/**
 * حفظ التقرير في ملف
 */
function saveReport(report, results) {
  const reportContent = `# تقرير التحقق من حالة المهام
تاريخ التقرير: ${new Date().toISOString()}

## الإحصائيات العامة
- إجمالي المهام المفحوصة: ${report.totalTasks}
- المهام المتطابقة: ${report.matchingTasks}
- دقة التطابق: ${report.accuracy}%

## تفاصيل النتائج

${results.map(r => `### ${r.name}
- الحالة المدعاة: ${r.claimed}
- الحالة الفعلية: ${r.actual}
- نسبة الإكمال: ${r.score}%
- التطابق: ${r.match ? 'نعم' : 'لا'}
`).join('\n')}

## التوصيات

### مهام مدعى اكتمالها لكنها غير مكتملة:
${report.recommendations.incompleteComplete.map(t => `- ${t.name} (${t.score}%)`).join('\n')}

### مهام يجب تحديث حالتها إلى مكتملة:
${report.recommendations.wrongProgress.map(t => `- ${t.name} (${t.score}%)`).join('\n')}
`;

  fs.writeFileSync('TASK_VERIFICATION_REPORT.md', reportContent);
  console.log(`\n💾 تم حفظ التقرير في: TASK_VERIFICATION_REPORT.md`);
}

// تشغيل التحقق
function main() {
  const allTasks = [...CLAIMED_COMPLETED_TASKS, ...CLAIMED_IN_PROGRESS_TASKS];
  const results = [];
  
  console.log(`🎯 فحص ${allTasks.length} مهمة...\n`);
  
  allTasks.forEach(task => {
    const result = verifyTask(task);
    results.push(result);
  });
  
  const report = generateReport(results);
  saveReport(report, results);
  
  console.log(`\n🎉 انتهى الفحص! دقة التطابق: ${report.accuracy}%`);
  
  if (report.accuracy >= 90) {
    console.log('✅ ممتاز! حالة المهام دقيقة جداً');
  } else if (report.accuracy >= 70) {
    console.log('⚠️ جيد، لكن يحتاج تحديثات طفيفة');
  } else {
    console.log('❌ يحتاج مراجعة وتحديث شامل لحالة المهام');
  }
}

// تشغيل الأداة
if (require.main === module) {
  main();
}

module.exports = { verifyTask, generateReport };