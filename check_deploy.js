const axios = require('axios');

const url = 'https://backend-ride-andhra-2-3.onrender.com/auth/login-by-phone';
const data = { phoneNumber: '9999999999' };

async function checkServer() {
    console.log('Checking server status...');
    try {
        const response = await axios.post(url, data);
        console.log('✅ SERVER IS READY! Status:', response.status);
        console.log('The new code is live. You can now use the app.');
        return true;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.log('❌ Server still running OLD code (404 Not Found).');
            console.log('Deployment is likely still in progress...');
        } else if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
            console.log('⚠️ Connection issue (Server might be restarting)...');
        } else {
            console.log(`⚠️ Status: ${error.response ? error.response.status : error.message}`);
        }
        return false;
    }
}

// Check once
checkServer();
