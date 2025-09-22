const sequelize = require('./config/database');
const { Section } = require('./models');

/**
 * تحليل وتحديث المستويات التعليمية للأقسام بناءً على أسمائها
 * 
 * أنماط الأسماء:
 * - TCL = الجذع المشترك للآداب
 * - TCS = الجذع المشترك للعلوم  
 * - TCSF = الجذع المشترك للعلوم الفرنسية
 * - 1BAC = السنة الأولى بكالوريا
 * - 2BAC = السنة الثانية بكالوريا
 * 
 * التخصصات:
 * - SH = آداب وعلوم إنسانية
 * - SE = علوم تجريبية
 * - SP = علوم فيزيائية
 * - SVT = علوم الحياة والأرض
 * - SHF = آداب وعلوم إنسانية فرنسية
 * - SEF = علوم تجريبية فرنسية
 * - SPF = علوم فيزيائية فرنسية
 */

function analyzeEducationalLevel(sectionName) {
  const name = sectionName.toUpperCase().trim();
  
  // تحديد المستوى التعليمي
  let educationalLevel = null;
  let specialization = null;
  
  if (name.startsWith('TCL')) {
    educationalLevel = 'جذع مشترك';
    specialization = 'آداب وعلوم إنسانية';
  } else if (name.startsWith('TCS')) {
    educationalLevel = 'جذع مشترك';
    if (name.includes('F')) {
      specialization = 'علوم تجريبية (فرنسية)';
    } else {
      specialization = 'علوم تجريبية';
    }
  } else if (name.startsWith('1BAC')) {
    educationalLevel = 'أولى بكالوريا';
    
    if (name.includes('SH')) {
      specialization = name.includes('F') ? 'آداب وعلوم إنسانية (فرنسية)' : 'آداب وعلوم إنسانية';
    } else if (name.includes('SE')) {
      specialization = name.includes('F') ? 'علوم تجريبية (فرنسية)' : 'علوم تجريبية';
    } else if (name.includes('SP')) {
      specialization = name.includes('F') ? 'علوم فيزيائية (فرنسية)' : 'علوم فيزيائية';
    } else if (name.includes('SVT')) {
      specialization = 'علوم الحياة والأرض';
    }
    
  } else if (name.startsWith('2BAC')) {
    educationalLevel = 'ثانية بكالوريا';
    
    if (name.includes('SH')) {
      specialization = name.includes('F') ? 'آداب وعلوم إنسانية (فرنسية)' : 'آداب وعلوم إنسانية';
    } else if (name.includes('SE')) {
      specialization = name.includes('F') ? 'علوم تجريبية (فرنسية)' : 'علوم تجريبية';
    } else if (name.includes('SP')) {
      specialization = name.includes('F') ? 'علوم فيزيائية (فرنسية)' : 'علوم فيزيائية';
    } else if (name.includes('SVT')) {
      specialization = 'علوم الحياة والأرض';
    }
  }
  
  return { educationalLevel, specialization };
}

async function updateEducationalLevels() {
  try {
    console.log('🔍 تحليل وتحديث المستويات التعليمية للأقسام...\n');
    
    // جلب جميع الأقسام
    const sections = await Section.findAll();
    console.log(`📚 العدد الإجمالي للأقسام: ${sections.length}\n`);
    
    let updatedCount = 0;
    
    for (const section of sections) {
      const analysis = analyzeEducationalLevel(section.name);
      
      console.log(`🔸 القسم: ${section.name}`);
      console.log(`   المستوى الحالي: ${section.educationalLevel || 'غير محدد'}`);
      console.log(`   التخصص الحالي: ${section.specialization || 'غير محدد'}`);
      console.log(`   المستوى المحلل: ${analysis.educationalLevel || 'غير معروف'}`);
      console.log(`   التخصص المحلل: ${analysis.specialization || 'غير معروف'}`);
      
      // تحديث البيانات إذا كانت مختلفة
      if (analysis.educationalLevel && 
          (section.educationalLevel !== analysis.educationalLevel || 
           section.specialization !== analysis.specialization)) {
        
        await section.update({
          educationalLevel: analysis.educationalLevel,
          specialization: analysis.specialization
        });
        
        console.log(`   ✅ تم التحديث!`);
        updatedCount++;
      } else {
        console.log(`   ⏭️ لا يحتاج تحديث`);
      }
      console.log('');
    }
    
    console.log(`📊 ملخص التحديث:`);
    console.log(`   - تم تحديث ${updatedCount} قسم`);
    console.log(`   - ${sections.length - updatedCount} قسم لم يحتج تحديث\n`);
    
    // عرض الأقسام مجمعة حسب المستوى
    const updatedSections = await Section.findAll();
    const groupedByLevel = {};
    
    updatedSections.forEach(section => {
      const level = section.educationalLevel || 'غير محدد';
      if (!groupedByLevel[level]) {
        groupedByLevel[level] = [];
      }
      groupedByLevel[level].push({
        name: section.name,
        specialization: section.specialization || 'غير محدد'
      });
    });
    
    console.log('📋 الأقسام مجمعة حسب المستوى التعليمي:');
    Object.keys(groupedByLevel).forEach(level => {
      console.log(`\n🎓 ${level}:`);
      groupedByLevel[level].forEach(section => {
        console.log(`   - ${section.name} (${section.specialization})`);
      });
    });
    
  } catch (error) {
    console.error('❌ خطأ في تحليل المستويات التعليمية:', error.message);
  } finally {
    await sequelize.close();
  }
}

// تشغيل التحليل والتحديث
if (require.main === module) {
  updateEducationalLevels();
}

module.exports = { analyzeEducationalLevel, updateEducationalLevels };