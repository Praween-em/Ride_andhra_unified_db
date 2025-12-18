const https = require('http');

const testCases = [
    { vehicleType: 'Bike' },
    { vehicleType: 'Auto' },
    { vehicleType: 'Cab' }, // Should fail or map to Car
    { vehicleType: 'Parcel' },
    { vehicleType: 'Bike-lite' }
];

testCases.forEach((test, index) => {
    const data = JSON.stringify({
        distance: 5,
        duration: 15,
        vehicleType: test.vehicleType
    });

    const options = {
        hostname: 'localhost',
        port: 8082,
        path: '/rides/fare',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length,
            // Assuming we need auth, but let's see if we get 403 or 500. 
            // 500 implies it got past the guard (if valid token was sending) or auth is broken.
            // The user logs showed "Token exists: true", so they are authenticated.
            // I'll grab the token from the user's previous log if I can, or use the login endpoint to get one.
        }
    };

    // To make this robust, I'll just login first to get a token.
});

async function runTests() {
    // 1. Login to get token
    const loginData = JSON.stringify({ phoneNumber: "1234567890" });

    // Helper for requests
    const makeRequest = (options, postData) => {
        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', d => body += d);
                res.on('end', () => resolve({ statusCode: res.statusCode, body }));
            });
            req.on('error', reject);
            if (postData) req.write(postData);
            req.end();
        });
    };

    try {
        const loginRes = await makeRequest({
            hostname: 'localhost',
            port: 8082,
            path: '/auth/login-verified',
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length }
        }, loginData);

        const token = JSON.parse(loginRes.body).accessToken || JSON.parse(loginRes.body).token;
        console.log("Got token:", token ? "Yes" : "No");

        for (const test of testCases) {
            const fareData = JSON.stringify({
                distance: 5,
                duration: 15,
                vehicleType: test.vehicleType
            });

            const fareRes = await makeRequest({
                hostname: 'localhost',
                port: 8082,
                path: '/rides/fare',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': fareData.length,
                    'Authorization': `Bearer ${token}`
                }
            }, fareData);

            console.log(`\nTesting ${test.vehicleType}: ${fareRes.statusCode}`);
            console.log(`Response: ${fareRes.body}`);
        }

    } catch (e) {
        console.error("Test failed:", e);
    }
}

runTests();
