const http = require('http');

console.log('🔄 اختبار API القوالب...');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/lesson-templates',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`✅ Status Code: ${res.statusCode}`);
    
    if (res.statusCode === 200) {
      const templates = JSON.parse(data);
      console.log(`📊 عدد القوالب في قاعدة البيانات: ${templates.length}`);
      
      if (templates.length > 0) {
        console.log('📚 عينة من القوالب:');
        templates.slice(0, 3).forEach(t => {
          console.log(`  - ${t.title} (${t.subject} - ${t.grade})`);
        });
      } else {
        console.log('⚠️ لا توجد قوالب في قاعدة البيانات');
        console.log('🔥 النظام جاهز لاستيراد النسخة الاحتياطية!');
      }
    } else {
      console.log('❌ خطأ في API:', data);
    }
  });
});

req.on('error', (err) => {
  console.log('❌ خطأ في الاتصال:', err.message);
});

req.end();