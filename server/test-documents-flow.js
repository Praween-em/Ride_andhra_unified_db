const fs = require('fs');
const path = require('path');

// Helper to make requests
async function request(url, method = 'GET', body = null, token = null, isFormData = false) {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!isFormData) headers['Content-Type'] = 'application/json';

    const options = {
        method,
        headers,
    };

    if (body) {
        options.body = isFormData ? body : JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();
    return { status: response.status, data };
}

async function runTest() {
    const baseUrl = 'http://localhost:3000';
    const phoneNumber = '+919876543210'; // Test number

    console.log('🚀 Starting Backend Test Flow...\n');

    // 1. Login
    console.log('1️⃣  Logging in...');
    const loginRes = await request(`${baseUrl}/auth/login-by-phone`, 'POST', { phoneNumber });

    if (loginRes.status !== 201 && loginRes.status !== 200) {
        console.error('❌ Login failed:', loginRes.data);
        return;
    }

    const token = loginRes.data.token;
    console.log('✅ Login successful. Token obtained.');

    // 2. Create dummy image files
    const dummyImagePath = path.join(__dirname, 'test-image.jpg');
    fs.writeFileSync(dummyImagePath, 'dummy image content');

    // 3. Register Driver (with documents)
    console.log('\n2️⃣  Registering Driver with documents...');

    const formData = new FormData();
    formData.append('phoneNumber', phoneNumber);
    formData.append('name', 'Test Driver');
    formData.append('licenseNumber', 'AP0120231234567');
    formData.append('vehicleModel', 'Honda Activa');
    formData.append('vehicleColor', 'Blue');
    formData.append('vehiclePlateNumber', 'AP01AB1234');

    // Create Blob from file buffer
    const fileBuffer = fs.readFileSync(dummyImagePath);
    const fileBlob = new Blob([fileBuffer], { type: 'image/jpeg' });

    formData.append('aadhaarPhoto', fileBlob, 'aadhar.jpg');
    formData.append('panPhoto', fileBlob, 'pan.jpg'); // Using panPhoto for now as backend expects it

    const registerRes = await request(`${baseUrl}/profile/register-driver`, 'POST', formData, token, true);

    if (registerRes.status !== 201) {
        console.error('❌ Registration failed:', registerRes.data);
    } else {
        console.log('✅ Driver registered successfully.');
    }

    // Cleanup
    fs.unlinkSync(dummyImagePath);
    console.log('\n✅ Test script finished.');
}

runTest();
