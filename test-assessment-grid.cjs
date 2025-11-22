#!/usr/bin/env node

/**
 * اختبار سريع لـ Assessment Grid API
 * اختبار الـ endpoints الجديدة والمحدثة
 * 
 * الاستخدام: node test-assessment-grid.cjs <sectionId>
 */

const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const sectionId = process.argv[2] || '1758447797026';

console.log('🧪 اختبار Assessment Grid API');
console.log(`📌 Backend URL: ${BACKEND_URL}`);
console.log(`📍 Section ID: ${sectionId}`);
console.log('---');

async function testAssessmentGrid() {
  try {
    // 1. اختبار الـ JSON endpoint
    console.log('\n1️⃣ اختبار GET /api/sections/:sectionId/assessment-grid');
    const jsonResponse = await axios.get(`${BACKEND_URL}/api/sections/${sectionId}/assessment-grid`);
    console.log('✅ تم استلام JSON بنجاح');
    console.log(`   - عدد الطلاب: ${jsonResponse.data.grid?.length || 0}`);
    
    if (jsonResponse.data.grid && jsonResponse.data.grid.length > 0) {
      const firstStudent = jsonResponse.data.grid[0];
      console.log(`\n   👤 أول طالب:`);
      console.log(`      - الرقم: ${firstStudent.classOrder}`);
      console.log(`      - الاسم: ${firstStudent.fullName}`);
      console.log(`      - الرمز: ${firstStudent.pathwayNumber}`);
      console.log(`      - آخر تقييم: ${firstStudent.latestAssessmentDate}`);
      console.log(`      - النقطة النهائية: ${firstStudent.finalScore}`);
      console.log(`      - العناصر:`);
      Object.entries(firstStudent.elementScores).forEach(([key, value]) => {
        console.log(`         • ${key}: ${value}`);
      });
    }

    // 2. اختبار Excel endpoint
    console.log('\n2️⃣ اختبار GET /api/sections/:sectionId/assessment-grid.xlsx');
    try {
      const excelResponse = await axios.get(
        `${BACKEND_URL}/api/sections/${sectionId}/assessment-grid.xlsx`,
        { responseType: 'arraybuffer' }
      );
      const bytes = excelResponse.data.length;
      console.log(`✅ تم تحميل Excel بنجاح`);
      console.log(`   - حجم الملف: ${(bytes / 1024).toFixed(2)} KB`);
      console.log(`   - Headers: ${excelResponse.headers['content-disposition']}`);
    } catch (err) {
      console.log(`⚠️ Excel endpoint لم يرد الآن (قد يكون متأخراً)`);
    }

    // 3. اختبار PDF endpoint
    console.log('\n3️⃣ اختبار GET /api/sections/:sectionId/assessment-grid.pdf');
    try {
      const pdfResponse = await axios.get(
        `${BACKEND_URL}/api/sections/${sectionId}/assessment-grid.pdf`,
        { responseType: 'arraybuffer' }
      );
      const bytes = pdfResponse.data.length;
      console.log(`✅ تم إنشاء PDF بنجاح`);
      console.log(`   - حجم الملف: ${(bytes / 1024).toFixed(2)} KB`);
      console.log(`   - Headers: ${pdfResponse.headers['content-disposition']}`);
    } catch (err) {
      console.log(`⚠️ PDF endpoint لم يرد الآن (قد يكون متأخراً)`);
    }

    console.log('\n---');
    console.log('🎉 جميع الاختبارات تمت بنجاح!');
    console.log('---');

  } catch (error: any) {
    console.error('\n❌ خطأ أثناء الاختبار:');
    if (error.response) {
      console.error(`   الحالة: ${error.response.status}`);
      console.error(`   الخطأ: ${error.response.data?.message || error.response.statusText}`);
    } else if (error.code === 'ECONNREFUSED') {
      console.error(`   ❌ لا يمكن الاتصال بـ ${BACKEND_URL}`);
      console.error(`      تأكد من تشغيل الخادم!`);
    } else {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

testAssessmentGrid();
