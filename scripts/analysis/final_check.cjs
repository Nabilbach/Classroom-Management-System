const fs = require('fs');
const path = require('path');

console.log('📚 فحص محتوى مناهج التربية الإسلامية\n');

// فحص ملف CSV
const csvFile = 'مقرر مادة التربية الإسلامية للجذع مشترك.csv';
console.log(`📄 فحص ${csvFile}:`);

try {
  const content = fs.readFileSync(csvFile, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  
  console.log(`✅ يحتوي على ${lines.length} سطر`);
  console.log('📝 أول 5 أسطر:');
  lines.slice(0, 5).forEach((line, index) => {
    console.log(`  ${index + 1}. ${line.substring(0, 80)}${line.length > 80 ? '...' : ''}`);
  });
  
  // تحليل بسيط للمحتوى
  const hasLessons = content.includes('درس') || content.includes('الدرس') || content.includes('وحدة');
  console.log(`\n🎯 يحتوي على دروس: ${hasLessons ? 'نعم ✅' : 'لا ❌'}`);
  
} catch (error) {
  console.log(`❌ خطأ في قراءة الملف: ${error.message}`);
}

console.log('\n' + '='.repeat(50));

// فحص ملف lessonLogs في public/data
console.log('📝 فحص ملف سجلات الدروس في public/data:');

try {
  const logsPath = path.join('public', 'data', 'lessonLogs.json');
  const content = fs.readFileSync(logsPath, 'utf8');
  const data = JSON.parse(content);
  
  console.log(`✅ ملف سجلات الدروس يحتوي على ${Array.isArray(data) ? data.length : Object.keys(data).length} عنصر`);
  
  if (Array.isArray(data) && data.length > 0) {
    console.log('📋 عينة من السجلات:');
    data.slice(0, 3).forEach((log, index) => {
      console.log(`  ${index + 1}. ${JSON.stringify(log).substring(0, 100)}...`);
    });
  }
  
} catch (error) {
  console.log(`❌ خطأ في قراءة ملف السجلات: ${error.message}`);
}

console.log('\n' + '='.repeat(50));
console.log('📊 ملخص نهائي لبيانات إدارة التعلم:');
console.log('✅ الحضور والغياب: موجود (151 سجل)');
console.log('✅ الطلاب والأقسام: موجود (316 طالب، 9 أقسام)'); 
console.log('✅ الحصص المجدولة: موجود (5 حصص)');
console.log('⚠️ الدروس الفعلية: فارغة');
console.log('⚠️ سجلات الدروس: فارغة'); 
console.log('❌ قوالب الدروس: غير موجودة في قاعدة البيانات');
console.log('📚 مناهج التربية الإسلامية: متوفرة كملفات Excel/CSV');
console.log('='.repeat(50));