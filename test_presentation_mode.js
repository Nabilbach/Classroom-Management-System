const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');

// Start the server with PRESENTATION_MODE=true
const serverProcess = spawn('node', ['index.js'], {
    cwd: path.join(__dirname, 'backend'),
    env: { ...process.env, PORT: 3001, PRESENTATION_MODE: 'true' },
    stdio: 'pipe'
});

let serverOutput = '';
serverProcess.stdout.on('data', (data) => {
    serverOutput += data.toString();
    // console.log('Server:', data.toString());
});

serverProcess.stderr.on('data', (data) => {
    console.error('Server Error:', data.toString());
});

const waitForServer = async () => {
    for (let i = 0; i < 20; i++) {
        try {
            await axios.get('http://localhost:3001/api/health');
            return true;
        } catch (e) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    return false;
};

const runTests = async () => {
    console.log('⏳ Starting server in Presentation Mode...');
    if (!await waitForServer()) {
        console.error('❌ Server failed to start');
        serverProcess.kill();
        process.exit(1);
    }
    console.log('✅ Server started');

    try {
        // Test 1: Check Config Endpoint
        console.log('\n🧪 Test 1: Check Config Endpoint');
        const configRes = await axios.get('http://localhost:3001/api/config');
        if (configRes.data.presentationMode === true) {
            console.log('✅ Config endpoint returns presentationMode: true');
        } else {
            console.error('❌ Config endpoint returned:', configRes.data);
        }

        // Test 2: Try to Create a Student (POST) - Should Fail
        console.log('\n🧪 Test 2: Try to Create Student (POST)');
        try {
            await axios.post('http://localhost:3001/api/students', {
                firstName: 'Test',
                lastName: 'User'
            });
            console.error('❌ POST request succeeded (Should have failed)');
        } catch (error) {
            if (error.response && error.response.status === 403) {
                console.log('✅ POST request blocked with 403 Forbidden');
            } else {
                console.error('❌ POST request failed with unexpected status:', error.response ? error.response.status : error.message);
            }
        }

        // Test 3: Try to Read Students (GET) - Should Succeed
        console.log('\n🧪 Test 3: Try to Read Students (GET)');
        try {
            const getRes = await axios.get('http://localhost:3001/api/students');
            if (getRes.status === 200) {
                console.log('✅ GET request succeeded');
            } else {
                console.error('❌ GET request failed with status:', getRes.status);
            }
        } catch (error) {
            console.error('❌ GET request failed:', error.message);
        }

    } catch (error) {
        console.error('Unexpected error:', error);
    } finally {
        serverProcess.kill();
        console.log('\n🏁 Tests completed');
    }
};

runTests();
