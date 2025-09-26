const axios = require('axios');
const db = require('./models');

const BASE_URL = 'http://localhost:3001/api/attendance';
let testRecordId = null;

// Helper function to format response for console
function logResponse(label, response) {
  console.log(`\n=== ${label} ===`);
  console.log(`Status: ${response.status}`);
  console.log(`Data:`, JSON.stringify(response.data, null, 2));
}

// Helper function to handle errors
function logError(label, error) {
  console.log(`\n❌ ERROR in ${label}:`);
  console.log(error.response ? error.response.data : error.message);
}

async function testAttendanceAPI() {
  console.log('🔬 Starting Attendance API Tests...\n');

  try {
    // Test 1: POST - Create attendance record
    console.log('📝 Test 1: Creating attendance record...');
    const createResponse = await axios.post(BASE_URL, {
      attendance: [{
        studentId: 1,
        sectionId: "1758447797026",
        date: "2025-09-27",
        isPresent: true
      }]
    });
    logResponse('POST /api/attendance', createResponse);
    
    if (createResponse.data.records && createResponse.data.records.length > 0) {
      testRecordId = createResponse.data.records[0].id;
      console.log(`✅ Created record with ID: ${testRecordId}`);
    }

    // Test 2: GET - Fetch attendance by date/section
    console.log('\n📖 Test 2: Fetching attendance by date and section...');
    const getByDateResponse = await axios.get(`${BASE_URL}?date=2025-09-27&sectionId=1758447797026`);
    logResponse('GET /api/attendance?date=2025-09-27&sectionId=1758447797026', getByDateResponse);

    // Test 3: GET /:id - Fetch individual record
    if (testRecordId) {
      console.log('\n🔍 Test 3: Fetching individual record by ID...');
      try {
        const getByIdResponse = await axios.get(`${BASE_URL}/${testRecordId}`);
        logResponse(`GET /api/attendance/${testRecordId}`, getByIdResponse);
        console.log(`✅ Individual record fetch successful`);
      } catch (error) {
        logError(`GET /api/attendance/${testRecordId}`, error);
      }
    }

    // Test 4: PUT /:id - Update record
    if (testRecordId) {
      console.log('\n✏️ Test 4: Updating attendance record...');
      try {
        const updateResponse = await axios.put(`${BASE_URL}/${testRecordId}`, {
          isPresent: false
        });
        logResponse(`PUT /api/attendance/${testRecordId}`, updateResponse);
        console.log(`✅ Record update successful`);
      } catch (error) {
        logError(`PUT /api/attendance/${testRecordId}`, error);
      }
    }

    // Test 5: Verify update worked
    if (testRecordId) {
      console.log('\n🔄 Test 5: Verifying update...');
      try {
        const verifyResponse = await axios.get(`${BASE_URL}/${testRecordId}`);
        logResponse(`GET /api/attendance/${testRecordId} (after update)`, verifyResponse);
        
        if (verifyResponse.data.isPresent === false) {
          console.log(`✅ Update verification successful - isPresent is now false`);
        } else {
          console.log(`❌ Update verification failed - isPresent should be false`);
        }
      } catch (error) {
        logError(`GET /api/attendance/${testRecordId} (verify)`, error);
      }
    }

    // Test 6: DELETE /:id - Delete individual record
    if (testRecordId) {
      console.log('\n🗑️ Test 6: Deleting individual record...');
      try {
        const deleteResponse = await axios.delete(`${BASE_URL}/${testRecordId}`);
        logResponse(`DELETE /api/attendance/${testRecordId}`, deleteResponse);
        console.log(`✅ Individual record deletion successful`);
      } catch (error) {
        logError(`DELETE /api/attendance/${testRecordId}`, error);
      }
    }

    // Test 7: Verify deletion
    if (testRecordId) {
      console.log('\n🔍 Test 7: Verifying deletion...');
      try {
        const verifyDeleteResponse = await axios.get(`${BASE_URL}/${testRecordId}`);
        console.log(`❌ Deletion verification failed - record still exists`);
        logResponse(`GET /api/attendance/${testRecordId} (should be 404)`, verifyDeleteResponse);
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.log(`✅ Deletion verification successful - record not found (404)`);
        } else {
          logError(`GET /api/attendance/${testRecordId} (verify deletion)`, error);
        }
      }
    }

    console.log('\n🎉 All attendance API tests completed!');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Start tests
testAttendanceAPI().finally(() => {
  console.log('\n📋 Test Summary:');
  console.log('- POST: Create attendance records');
  console.log('- GET (query): Fetch by date/section');
  console.log('- GET (id): Fetch individual record');
  console.log('- PUT (id): Update record');
  console.log('- DELETE (id): Remove record');
  console.log('\n✨ Attendance API testing completed!');
  process.exit(0);
});