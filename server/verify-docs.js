const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '8520894522',
    database: 'ride_andhra',
});

async function verifyDocuments() {
    try {
        await client.connect();

        // Get the most recent driver
        const driverRes = await client.query(`
      SELECT user_id, first_name, last_name, vehicle_model
      FROM driver_profiles
      ORDER BY created_at DESC
      LIMIT 1;
    `);

        if (driverRes.rows.length === 0) {
            console.log('No drivers found');
            return;
        }

        const driver = driverRes.rows[0];
        console.log('📋 Latest Driver:', driver);

        // Get documents for this driver
        const docsRes = await client.query(`
      SELECT 
        document_type,
        file_name,
        mime_type,
        file_size,
        LENGTH(document_image) as image_bytes,
        status,
        created_at
      FROM driver_documents
      WHERE driver_id = $1
      ORDER BY created_at DESC;
    `, [driver.user_id]);

        console.log(`\n📄 Documents (${docsRes.rows.length} total):`);
        docsRes.rows.forEach(doc => {
            console.log(`  ✅ ${doc.document_type}:`);
            console.log(`     File: ${doc.file_name}`);
            console.log(`     Size: ${doc.file_size} bytes (${doc.image_bytes} bytes in DB)`);
            console.log(`     Type: ${doc.mime_type}`);
            console.log(`     Status: ${doc.status}`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await client.end();
    }
}

verifyDocuments();
