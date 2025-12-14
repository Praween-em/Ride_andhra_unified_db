const fs = require('fs');
const path = require('path');

async function simpleTest() {
    const baseUrl = 'http://localhost:3000';
    const phoneNumber = '+919111111111';

    try {
        // 1. Login
        console.log('1️⃣  Logging in...');
        const loginRes = await fetch(`${baseUrl}/auth/login-by-phone`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber }),
        });

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('✅ Token:', token.substring(0, 20) + '...\n');

        // 2. Create test image
        const testImagePath = path.join(__dirname, 'test-image.jpg');
        fs.writeFileSync(testImagePath, Buffer.from('fake image data'));
        const fileBuffer = fs.readFileSync(testImagePath);
        const fileBlob = new Blob([fileBuffer], { type: 'image/jpeg' });

        // 3. Register with 3 images
        console.log('2️⃣  Registering driver...');
        const formData = new FormData();
        formData.append('phoneNumber', phoneNumber);
        formData.append('name', 'Test Driver');
        formData.append('licenseNumber', 'TEST123456');
        formData.append('vehicleModel', 'Honda');
        formData.append('vehicleColor', 'Blue');
        formData.append('vehiclePlateNumber', 'TEST1234');

        formData.append('profilePhoto', fileBlob, 'profile.jpg');
        formData.append('aadhaarPhoto', fileBlob, 'aadhar.jpg');
        formData.append('licensePhoto', fileBlob, 'license.jpg');

        const registerRes = await fetch(`${baseUrl}/profile/register-driver`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        });

        console.log('Status:', registerRes.status);
        const registerData = await registerRes.json();
        console.log('Response:', JSON.stringify(registerData, null, 2));

        // Cleanup
        fs.unlinkSync(testImagePath);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

simpleTest();
