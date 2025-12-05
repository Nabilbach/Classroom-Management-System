#!/usr/bin/env node

/**
 * التحقق من الإطلاق النهائي
 * يتحقق من جميع الملفات والمكتبات المطلوبة
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const checks = [];

function check(name, fn) {
  try {
    const result = fn();
    checks.push({ name, status: result ? '✅' : '❌', result });
    return result;
  } catch (e) {
    checks.push({ name, status: '⚠️', result: e.message });
    return false;
  }
}

console.log('🔍 التحقق من الإطلاق النهائي\n');
console.log('═'.repeat(60));

// ملفات جديدة
console.log('\n📁 الملفات الجديدة:');
check('AssessmentGridRTL.tsx', () => 
  fs.existsSync(path.join(projectRoot, 'src/components/assessment/AssessmentGridRTL.tsx'))
);
check('test-assessment-grid.cjs', () =>
  fs.existsSync(path.join(projectRoot, 'test-assessment-grid.cjs'))
);
check('ASSESSMENT_GRID_LAUNCH_REPORT.md', () =>
  fs.existsSync(path.join(projectRoot, 'ASSESSMENT_GRID_LAUNCH_REPORT.md'))
);
check('ASSESSMENT_GRID_QUICK_START.md', () =>
  fs.existsSync(path.join(projectRoot, 'ASSESSMENT_GRID_QUICK_START.md'))
);
check('FINAL_DEPLOYMENT_CHECKLIST.md', () =>
  fs.existsSync(path.join(projectRoot, 'FINAL_DEPLOYMENT_CHECKLIST.md'))
);
check('README_ASSESSMENT_GRID.md', () =>
  fs.existsSync(path.join(projectRoot, 'README_ASSESSMENT_GRID.md'))
);

// ملفات معدلة
console.log('\n✏️ الملفات المعدلة:');
check('backend/index.js', () => {
  const content = fs.readFileSync(path.join(projectRoot, 'backend/index.js'), 'utf8');
  return content.includes('assessment-grid.pdf');
});
check('StudentManagement.tsx', () => {
  const content = fs.readFileSync(path.join(projectRoot, 'src/pages/StudentManagement.tsx'), 'utf8');
  return content.includes('AssessmentGridRTL');
});
check('backend/package.json', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'backend/package.json'), 'utf8'));
  return pkg.dependencies.pdfkit && pkg.dependencies.exceljs;
});

// التحقق من المكتبات
console.log('\n📚 المكتبات:');
check('pdfkit installed', () =>
  fs.existsSync(path.join(projectRoot, 'backend/node_modules/pdfkit'))
);
check('exceljs installed', () =>
  fs.existsSync(path.join(projectRoot, 'backend/node_modules/exceljs'))
);

// التحقق من المحتوى
console.log('\n🔎 التحقق من المحتوى:');
check('normalizeTo10 في backend', () => {
  const content = fs.readFileSync(path.join(projectRoot, 'backend/index.js'), 'utf8');
  return content.includes('normalizeTo10');
});
check('PDF endpoint في backend', () => {
  const content = fs.readFileSync(path.join(projectRoot, 'backend/index.js'), 'utf8');
  return content.includes("app.get('/api/sections/:sectionId/assessment-grid.pdf'");
});
check('RTL component component', () => {
  const content = fs.readFileSync(path.join(projectRoot, 'src/components/assessment/AssessmentGridRTL.tsx'), 'utf8');
  return content.includes('AssessmentGridRTL') && content.includes('RTL');
});

// النتائج
console.log('\n' + '═'.repeat(60));
console.log('\n📊 نتائج الفحص:\n');

checks.forEach(check => {
  console.log(`${check.status} ${check.name}`);
});

const passed = checks.filter(c => c.status === '✅').length;
const total = checks.length;

console.log('\n' + '═'.repeat(60));
console.log(`\n📈 الملخص: ${passed}/${total} ✅\n`);

if (passed === total) {
  console.log('🎉 جميع الفحوصات نجحت! النظام جاهز للإطلاق! 🚀\n');
  process.exit(0);
} else {
  console.log('⚠️ هناك بعض المشاكل يجب حلها.\n');
  process.exit(1);
}
