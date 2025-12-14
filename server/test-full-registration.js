const fs = require('fs');
const path = require('path');

async function testFullRegistration() {
    const baseUrl = 'http://localhost:3000';
    const phoneNumber = '+919999999999';

    console.log('🧪 Testing Complete 5-Image Registration Flow\n');

    try {
        // Create test image
        const testImagePath = path.join(__dirname, 'test-image.jpg');
        fs.writeFileSync(testImagePath, Buffer.from('test image data'));
        const fileBuffer = fs.readFileSync(testImagePath);
        const fileBlob = new Blob([fileBuffer], { type: 'image/jpeg' });

        // Test registration
        console.log('📝 Registering driver with 5 images...');
        const formData = new FormData();

        // Text fields
        formData.append('phoneNumber', phoneNumber);
        formData.append('name', 'Test Driver Full');
        formData.append('licenseNumber', 'TEST123456');
        formData.append('vehicleModel', 'Honda Activa');
        formData.append('vehicleColor', 'Blue');
        formData.append('vehiclePlateNumber', 'TEST1234');

        // 5 Images
        formData.append('profilePhoto', fileBlob, 'profile.jpg');
        formData.append('licenseFrontPhoto', fileBlob, 'license_front.jpg');
        formData.append('licenseBackPhoto', fileBlob, 'license_back.jpg');
        formData.append('aadhaarPhoto', fileBlob, 'aadhar.jpg');
        formData.append('panPhoto', fileBlob, 'pan.jpg');

        const registerRes = await fetch(`${baseUrl}/profile/register-driver`, {
            method: 'POST',
            body: formData,
        });

        console.log('Status:', registerRes.status);
        const registerData = await registerRes.json();

        if (registerRes.status === 201 || registerRes.status === 200) {
            console.log('✅ Registration successful!');
            console.log('Response:', JSON.stringify(registerData, null, 2));

            // Verify documents
            if (registerData.driverId) {
                console.log('\n📄 Checking documents...');
                const docsRes = await fetch(`${baseUrl}/profile/documents/${registerData.driverId}`);
                const docs = await docsRes.json();

                console.log(`Found ${docs.length} documents:`);
                docs.forEach(doc => {
                    console.log(`  ✅ ${doc.documentType}: ${doc.fileName} (${doc.fileSize} bytes)`);
                });
            }
        } else {
            console.error('❌ Registration failed!');
            console.error('Response:', JSON.stringify(registerData, null, 2));
        }

        // Cleanup
        fs.unlinkSync(testImagePath);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

testFullRegistration();
