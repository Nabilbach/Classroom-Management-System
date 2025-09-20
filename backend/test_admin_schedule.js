const http = require('http');

// Test GET request
const testGet = () => {
  return new Promise((resolve, reject) => {
    const req = http.request('http://localhost:3000/api/admin-schedule', { method: 'GET' }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('GET Status:', res.statusCode);
        console.log('GET Response:', data);
        resolve(data);
      });
    });
    req.on('error', reject);
    req.end();
  });
};

// Test POST request
const testPost = () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
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
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('POST Status:', res.statusCode);
        console.log('POST Response:', data);
        resolve(data);
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

// Run tests
async function runTests() {
  try {
    console.log('Testing GET request...');
    await testGet();
    
    console.log('\nTesting POST request...');
    await testPost();
    
    console.log('\nTesting GET request again...');
    await testGet();
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

runTests();