const fs = require('fs');
const path = require('path');

console.log('🔍 فحص ملفات النظام للبحث عن بيانات إدارة التعلم\n');

// البحث في ملفات JSON
const jsonFiles = [
  'backend/lessons.json',
  'backend/lessonLogs.json', 
  'backend/sections.json'
];

jsonFiles.forEach(filePath => {
  const fullPath = path.resolve(__dirname, filePath);
  console.log(`📁 فحص ${filePath}:`);
  
  try {
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const data = JSON.parse(content);
      
      if (Array.isArray(data)) {
        console.log(`✅ يحتوي على ${data.length} عنصر`);
        if (data.length > 0) {
          console.log(`   عينة من البيانات: ${JSON.stringify(data[0]).substring(0, 100)}...`);
        }
      } else if (typeof data === 'object') {
        const keys = Object.keys(data);
        console.log(`✅ يحتوي على ${keys.length} مفتاح: ${keys.slice(0, 3).join(', ')}`);
      }
    } else {
      console.log('❌ الملف غير موجود');
    }
  } catch (error) {
    console.log(`❌ خطأ في قراءة الملف: ${error.message}`);
  }
  console.log();
});

// فحص ملفات Excel للمناهج
console.log('📚 فحص ملفات المناهج (Excel):');
const files = fs.readdirSync(__dirname);
const excelFiles = files.filter(file => file.endsWith('.xlsx') || file.endsWith('.csv'));

console.log(`📊 وجد ${excelFiles.length} ملف Excel/CSV:`);
excelFiles.forEach((file, index) => {
  const stats = fs.statSync(path.join(__dirname, file));
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  console.log(`  ${index + 1}. ${file} (${sizeMB} MB)`);
});

console.log();

// البحث عن مجلدات البيانات
console.log('📂 فحص مجلدات البيانات:');
const dataDirs = ['public/data', 'src/data', 'backend/data'];

dataDirs.forEach(dir => {
  const fullPath = path.resolve(__dirname, dir);
  console.log(`📁 ${dir}:`);
  
  try {
    if (fs.existsSync(fullPath)) {
      const files = fs.readdirSync(fullPath);
      console.log(`✅ يحتوي على ${files.length} ملف: ${files.slice(0, 5).join(', ')}`);
    } else {
      console.log('❌ المجلد غير موجود');
    }
  } catch (error) {
    console.log(`❌ خطأ: ${error.message}`);
  }
  console.log();
});