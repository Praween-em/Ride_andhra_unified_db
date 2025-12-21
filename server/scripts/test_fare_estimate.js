const axios = require('axios');

const API_URL = 'https://ride-andhra-unified-db.onrender.com'; // Using confirmed running port
const TEST_PHONE = '+919876543210'; // Functioning seeded user often exists, or we try another if fails

async function testFareEstimate() {
    console.log('🧪 Testing Fare Estimate Endpoint...');

    let token = null;

    // 1. Login
    try {
        console.log(`🔐 Logging in as ${TEST_PHONE}...`);
        // Attempt login (using common test credentials logic if exists, or just requesting OTP/Verify flow)
        // Based on test-simple.js, it seems /auth/login-by-phone might return a token directly for test users or debug mode
        // If not, we might need a specific seeded user.
        // Let's try the one from test-simple.js: +919111111111

        const loginRes = await axios.post(`${API_URL}/auth/login-by-phone`, {
            phoneNumber: '+919111111111'
        });

        if (loginRes.data && loginRes.data.token) {
            token = loginRes.data.token;
            console.log('✅ Login successful. Token received.');
        } else {
            console.log('⚠️ Login response did not contain token:', loginRes.data);
            // Fallback: try to just use a dummy token if auth is mocked in dev? No, likely need real one.
            return;
        }

    } catch (error) {
        console.error('❌ Login Failed:', error.message);
        if (error.response) console.error(error.response.data);
        return;
    }

    // 2. Test Fare Estimate
    const payload = {
        distance: 12.5, // 12.5 km
        duration: 35    // 35 minutes
    };

    try {
        console.log(`\n📡 Sending request to ${API_URL}/rides/fare-estimate`);
        console.log('📦 Payload:', payload);

        const response = await axios.post(
            `${API_URL}/rides/fare-estimate`,
            payload,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        console.log('\n✅ Success! Response received:');
        if (Array.isArray(response.data)) {
            console.table(response.data);
            console.log(`\nFound ${response.data.length} vehicle options.`);

            // Validation
            const hasBike = response.data.some(f => f.vehicleType === 'bike');
            const hasAuto = response.data.some(f => f.vehicleType === 'auto');

            if (hasBike && hasAuto) {
                console.log('🌟 Validation Passed: Contains expected vehicle types.');
            } else {
                console.log('⚠️ Warning: Might be missing some vehicle types.');
            }

        } else {
            console.log('Response:', response.data);
        }

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error(`\n❌ Connection Failed. Is the server running on port ${API_URL.split(':').pop()}?`);
        } else {
            console.error('\n❌ Error:', error.message);
            if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Data:', error.response.data);
            }
        }
    }
}

testFareEstimate();
