const http = require('http');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            json: () => Promise.resolve(JSON.parse(data)),
            text: () => Promise.resolve(data)
          });
        } catch (error) {
          resolve({
            ok: false,
            status: res.statusCode,
            statusText: res.statusMessage,
            json: () => Promise.reject(error),
            text: () => Promise.resolve(data)
          });
        }
      });
    }).on('error', reject);
  });
}

async function testAPI() {
  try {
    console.log('🧪 Testing API endpoints\n');
    
    const tests = [
      { 
        name: 'جذع مشترك',
        url: 'http://localhost:3000/api/scheduled-lessons/textbook?level=جذع مشترك'
      },
      { 
        name: 'أولى باكالوريا',
        url: 'http://localhost:3000/api/scheduled-lessons/textbook?level=أولى باكالوريا'
      },
      { 
        name: 'All (no filter)',
        url: 'http://localhost:3000/api/scheduled-lessons/textbook'
      }
    ];
    
    for (const test of tests) {
      console.log(`\n📡 Testing: ${test.name}`);
      console.log(`   URL: ${test.url}`);
      console.log(`   Encoded: ${encodeURI(test.url)}`);
      
      try {
        const response = await makeRequest(test.url);
        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ Success! Found ${data.length} entries`);
          
          if (data.length > 0) {
            console.log(`   Sample entries:`);
            data.slice(0, 3).forEach(entry => {
              console.log(`     - ${entry.date}: ${entry.sectionName} - ${entry.subjectDetails?.substring(0, 50)}...`);
            });
          }
        } else {
          const error = await response.text();
          console.log(`   ❌ Error response:`, error);
        }
      } catch (error) {
        console.log(`   ❌ Request failed:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Check if server is running first
makeRequest('http://localhost:3000/api/health')
  .then(response => {
    if (response.ok) {
      console.log('✅ Server is running\n');
      return testAPI();
    } else {
      throw new Error('Server returned non-OK status');
    }
  })
  .catch(error => {
    console.log('❌ Server is not running!');
    console.log('   Please start the backend server first.');
    console.log('   Error:', error.message);
  });
