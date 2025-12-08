#!/usr/bin/env node
// Quick test of the API endpoint

const http = require('http');

const options = {
  hostname: 'localhost',
  port: 4201,
  path: '/api/lesson-templates',
  method: 'GET',
  timeout: 5000
};

console.log('🧪 Testing http://localhost:4201/api/lesson-templates');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:');
    try {
      const json = JSON.parse(data);
      console.log(` - Type: ${Array.isArray(json) ? 'Array' : 'Object'}`);
      console.log(` - Length: ${json.length || 'N/A'}`);
      if (Array.isArray(json) && json.length > 0) {
        console.log(` - First item:`, JSON.stringify(json[0]).substring(0, 100));
      }
    } catch (e) {
      console.log(` - Raw: ${data.substring(0, 200)}`);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Error: ${e.message}`);
});

req.on('timeout', () => {
  console.error('❌ Request timed out');
  req.abort();
});

req.end();
