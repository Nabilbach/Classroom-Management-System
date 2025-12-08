#!/usr/bin/env node
// Direct test inside backend

const http = require('http');

async function test() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4201,
      path: '/api/lesson-templates',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            console.log(`✅ SUCCESS! Got ${json.length} templates`);
            resolve(true);
          } catch (e) {
            console.log(`❌ Parse error: ${e.message}`);
            console.log(`Data: ${data.substring(0, 100)}`);
            resolve(false);
          }
        } else {
          console.log(`❌ Status ${res.statusCode}: ${data.substring(0, 100)}`);
          resolve(false);
        }
      });
    });

    req.on('error', err => {
      console.log(`❌ Error: ${err.message}`);
      reject(err);
    });

    req.end();
  });
}

test().catch(console.error);
