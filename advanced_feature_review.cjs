/**
 * 🔍 أداة مراجعة الميزات المتقدمة - Advanced Feature Review Tool
 * تتحقق بشكل أعمق من الميزات الموجودة فعلياً في الكود
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 === مراجعة متقدمة للميزات المطبقة === \n');

/**
 * فحص تفصيلي للميزات في StudentManagement.tsx
 */
function checkStudentManagementFeatures() {
  console.log('📋 === فحص ميزات إدارة الطلاب ===');
  
  const filePath = 'src/pages/StudentManagement.tsx';
  if (!fs.existsSync(filePath)) {
    console.log('❌ ملف إدارة الطلاب غير موجود');
    return {};
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  const features = {
    // ميزات الحضور
    attendance: {
      basicMode: content.includes('isAttendanceMode'),
      bulkActions: content.includes('handleMarkAllPresent') && content.includes('handleMarkAllAbsent'),
      exceptions: content.includes('handleMarkAllPresentExcept') && content.includes('handleMarkAllAbsentExcept'),
      saveFunction: content.includes('handleSaveAttendance'),
      apiCall: content.includes('/api/attendance'),
      individualToggle: content.includes('handleToggleAttendance')
    },
    
    // ميزات إدارة الطلاب
    studentManagement: {
      addStudent: content.includes('handleAddStudent') || content.includes('setIsAddModalOpen'),
      editStudent: content.includes('handleEditStudent'),
      deleteStudent: content.includes('handleDeleteStudent'),
      bulkDelete: content.includes('handleDeleteAllStudents'),
      excelUpload: content.includes('setIsExcelUploadModalOpen'),
      search: content.includes('searchTerm') || content.includes('debouncedSearchTerm')
    },
    
    // ميزات الواجهة
    ui: {
      filterDrawer: content.includes('isFilterDrawerOpen'),
      sectionSelection: content.includes('currentSection'),
      dragAndDrop: content.includes('DndContext') || content.includes('useSensors'),
      responsiveDesign: content.includes('flex-wrap') || content.includes('grid'),
      modals: content.includes('Dialog') || content.includes('Modal')
    }
  };
  
  // طباعة النتائج
  Object.entries(features).forEach(([category, categoryFeatures]) => {
    console.log(`\n📂 ${category.toUpperCase()}:`);
    Object.entries(categoryFeatures).forEach(([feature, exists]) => {
      console.log(`  ${exists ? '✅' : '❌'} ${feature}`);
    });
  });
  
  return features;
}

/**
 * فحص ميزات الحضور في backend
 */
function checkAttendanceBackend() {
  console.log('\n🔧 === فحص backend للحضور ===');
  
  const filePath = 'backend/routes/attendance.js';
  if (!fs.existsSync(filePath)) {
    console.log('❌ ملف مسارات الحضور غير موجود');
    return {};
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  const features = {
    routes: {
      postAttendance: content.includes('router.post'),
      getAttendance: content.includes('router.get'),
      deleteAttendance: content.includes('router.delete'),
      updateAttendance: content.includes('router.put')
    },
    
    functionality: {
      bulkSave: content.includes('Array.isArray(attendance)'),
      sectionResolution: content.includes('findSectionByName'),
      errorHandling: content.includes('try') && content.includes('catch'),
      validation: content.includes('isFinite') || content.includes('validation'),
      relationships: content.includes('Student') && content.includes('Section')
    }
  };
  
  Object.entries(features).forEach(([category, categoryFeatures]) => {
    console.log(`\n📂 ${category.toUpperCase()}:`);
    Object.entries(categoryFeatures).forEach(([feature, exists]) => {
      console.log(`  ${exists ? '✅' : '❌'} ${feature}`);
    });
  });
  
  return features;
}

/**
 * فحص نماذج البيانات
 */
function checkDataModels() {
  console.log('\n🗃️ === فحص نماذج البيانات ===');
  
  const modelsPath = 'backend/models';
  if (!fs.existsSync(modelsPath)) {
    console.log('❌ مجلد النماذج غير موجود');
    return {};
  }
  
  const modelFiles = fs.readdirSync(modelsPath).filter(f => f.endsWith('.js'));
  console.log(`📁 النماذج الموجودة: ${modelFiles.length} ملف`);
  
  const models = {};
  modelFiles.forEach(file => {
    const modelName = file.replace('.js', '');
    const content = fs.readFileSync(path.join(modelsPath, file), 'utf8');
    
    models[modelName] = {
      hasSequelize: content.includes('sequelize.define'),
      hasRelationships: content.includes('associations') || content.includes('belongsTo') || content.includes('hasMany'),
      hasValidation: content.includes('allowNull') || content.includes('validate'),
      isExported: content.includes('module.exports')
    };
    
    const status = Object.values(models[modelName]).every(Boolean) ? '✅' : '⚠️';
    console.log(`  ${status} ${modelName}`);
  });
  
  return models;
}

/**
 * فحص مكونات الواجهة
 */
function checkUIComponents() {
  console.log('\n🎨 === فحص مكونات الواجهة ===');
  
  const componentsPath = 'src/components';
  if (!fs.existsSync(componentsPath)) {
    console.log('❌ مجلد المكونات غير موجود');
    return {};
  }
  
  // البحث عن مكونات مهمة
  const importantComponents = [
    'AttendanceTracker.tsx',
    'AbsenceHistoryContent.tsx',
    'StudentCard.tsx',
    'StudentTable.tsx'
  ];
  
  const components = {};
  
  function searchInDirectory(dir, prefix = '') {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    items.forEach(item => {
      if (item.isDirectory()) {
        searchInDirectory(path.join(dir, item.name), prefix + item.name + '/');
      } else if (item.name.endsWith('.tsx') || item.name.endsWith('.ts')) {
        const fullName = prefix + item.name;
        const isImportant = importantComponents.some(imp => fullName.includes(imp.replace('.tsx', '')));
        
        if (isImportant) {
          const content = fs.readFileSync(path.join(dir, item.name), 'utf8');
          
          components[fullName] = {
            hasProps: content.includes('interface') && content.includes('Props'),
            usesHooks: content.includes('useState') || content.includes('useEffect'),
            hasMaterialUI: content.includes('@material-tailwind') || content.includes('@mui'),
            isExported: content.includes('export default') || content.includes('export {')
          };
          
          const status = Object.values(components[fullName]).filter(Boolean).length >= 3 ? '✅' : '⚠️';
          console.log(`  ${status} ${fullName}`);
        }
      }
    });
  }
  
  searchInDirectory(componentsPath);
  
  return components;
}

/**
 * تقييم الحالة الإجمالية
 */
function evaluateOverallStatus(results) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 === تقييم الحالة الإجمالية ===');
  console.log('='.repeat(60));
  
  const scores = {
    studentManagement: 0,
    attendance: 0,
    backend: 0,
    dataModels: 0,
    ui: 0
  };
  
  // حساب نقاط إدارة الطلاب
  if (results.studentFeatures) {
    const allFeatures = Object.values(results.studentFeatures).flatMap(cat => Object.values(cat));
    scores.studentManagement = Math.round((allFeatures.filter(Boolean).length / allFeatures.length) * 100);
  }
  
  // حساب نقاط الحضور
  if (results.attendanceBackend) {
    const allFeatures = Object.values(results.attendanceBackend).flatMap(cat => Object.values(cat));
    scores.attendance = Math.round((allFeatures.filter(Boolean).length / allFeatures.length) * 100);
  }
  
  // حساب نقاط النماذج
  if (results.models) {
    const modelScores = Object.values(results.models).map(model => 
      Object.values(model).filter(Boolean).length / Object.values(model).length
    );
    scores.dataModels = Math.round((modelScores.reduce((a, b) => a + b, 0) / modelScores.length) * 100) || 0;
  }
  
  // حساب نقاط المكونات
  if (results.components) {
    const componentScores = Object.values(results.components).map(comp => 
      Object.values(comp).filter(Boolean).length / Object.values(comp).length
    );
    scores.ui = Math.round((componentScores.reduce((a, b) => a + b, 0) / componentScores.length) * 100) || 0;
  }
  
  const overallScore = Math.round(Object.values(scores).reduce((a, b) => a + b) / Object.values(scores).length);
  
  console.log('\n📈 النتائج النهائية:');
  Object.entries(scores).forEach(([category, score]) => {
    const icon = score >= 80 ? '🟢' : score >= 60 ? '🟡' : '🔴';
    console.log(`   ${icon} ${category}: ${score}%`);
  });
  
  console.log(`\n🎯 النتيجة الإجمالية: ${overallScore}%`);
  
  // تحديد الحالة الفعلية للمشروع
  let projectStatus = 'بداية التطوير';
  if (overallScore >= 90) {
    projectStatus = 'مكتمل تقريباً';
  } else if (overallScore >= 70) {
    projectStatus = 'متقدم جداً';
  } else if (overallScore >= 50) {
    projectStatus = 'متوسط التقدم';
  } else if (overallScore >= 30) {
    projectStatus = 'بداية متوسطة';
  }
  
  console.log(`📊 حالة المشروع: ${projectStatus}`);
  
  return { scores, overallScore, projectStatus };
}

// تشغيل الفحص الشامل
function main() {
  const results = {};
  
  try {
    results.studentFeatures = checkStudentManagementFeatures();
    results.attendanceBackend = checkAttendanceBackend();
    results.models = checkDataModels();
    results.components = checkUIComponents();
    
    const evaluation = evaluateOverallStatus(results);
    
    // حفظ تقرير مفصل
    const report = {
      timestamp: new Date().toISOString(),
      evaluation,
      details: results
    };
    
    fs.writeFileSync('DETAILED_FEATURE_ANALYSIS.json', JSON.stringify(report, null, 2));
    console.log('\n💾 تم حفظ التحليل المفصل في: DETAILED_FEATURE_ANALYSIS.json');
    
    console.log('\n🎉 انتهى الفحص المتقدم!');
    
  } catch (error) {
    console.error('❌ حدث خطأ أثناء الفحص:', error.message);
  }
}

// تشغيل الأداة
if (require.main === module) {
  main();
}

module.exports = { checkStudentManagementFeatures, checkAttendanceBackend, evaluateOverallStatus };