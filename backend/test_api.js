const http = require('http');

const data = JSON.stringify({
  day: 'الإثنين',
  startTime: '09:00',
  duration: 1,
  sectionId: 'test-section',
  classroom: 'قاعة-1',
  sessionType: 'official'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin-schedule',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', responseData);
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.write(data);
req.end();