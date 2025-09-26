const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/attendance',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('عدد السجلات:', json.length);
      console.log('أول 3 سجلات:');
      json.slice(0, 3).forEach((rec, i) => {
        console.log(`${i+1}. Date: ${rec.date}, Present: ${rec.isPresent}, Student: ${rec.studentId}`);
      });
    } catch (e) {
      console.log('Response:', data);
    }
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.error('Error:', err.message);
  process.exit(1);
});

req.end();