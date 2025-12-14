const fs = require('fs');
const path = require('path');

async function testThreeImages() {
    const baseUrl = 'http://localhost:3000';
    const phoneNumber = '+919876543210';

    console.log('🚀 Testing Driver Registration with 3 Images...\n');

    // 1. Login
    console.log('1️⃣  Logging in...');
    const loginRes = await fetch(`${baseUrl}/auth/login-by-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
    });

    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('✅ Login successful\n');

    // 2. Create test images
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    fs.writeFileSync(testImagePath, 'test image content');
    const fileBuffer = fs.readFileSync(testImagePath);
    const fileBlob = new Blob([fileBuffer], { type: 'image/jpeg' });

    // 3. Register with 3 images
    console.log('2️⃣  Registering driver with 3 images...');
    const formData = new FormData();
    formData.append('phoneNumber', phoneNumber);
    formData.append('name', 'Test Driver Three Images');
    formData.append('licenseNumber', 'AP0120231234567');
    formData.append('vehicleModel', 'Honda Activa');
    formData.append('vehicleColor', 'Blue');
    formData.append('vehiclePlateNumber', 'AP01AB1234');

    formData.append('profilePhoto', fileBlob, 'profile.jpg');
    formData.append('aadhaarPhoto', fileBlob, 'aadhar.jpg');
    formData.append('licensePhoto', fileBlob, 'license.jpg');

    const registerRes = await fetch(`${baseUrl}/profile/register-driver`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
    });

    const registerData = await registerRes.json();

    if (registerRes.status === 201 || registerRes.status === 200) {
        console.log('✅ Registration successful!');
        console.log('   Driver ID:', registerData.driverId);

        // 4. Verify documents were created
        console.log('\n3️⃣  Verifying documents...');
        const docsRes = await fetch(`${baseUrl}/profile/documents/${registerData.driverId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        const docs = await docsRes.json();

        console.log(`✅ Found ${docs.length} documents:`);
        docs.forEach(doc => {
            console.log(`   - ${doc.documentType}: ${doc.fileName} (${doc.fileSize} bytes)`);
        });
    } else {
        console.error('❌ Registration failed:', registerData);
    }

    // Cleanup
    fs.unlinkSync(testImagePath);
    console.log('\n✅ Test completed!');
}

testThreeImages();
