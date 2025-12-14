const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '8520894522',
    database: 'ride_andhra',
});

async function updateConstraint() {
    try {
        await client.connect();
        console.log('✅ Connected to database');

        // Drop old constraint
        await client.query(`
      ALTER TABLE driver_documents 
      DROP CONSTRAINT IF EXISTS driver_documents_type_check;
    `);
        console.log('✅ Dropped old constraint');

        // Add new constraint with license_back
        await client.query(`
      ALTER TABLE driver_documents 
      ADD CONSTRAINT driver_documents_type_check 
      CHECK (document_type IN ('profile_image', 'aadhar', 'license', 'license_back', 'pan', 'vehicle_rc', 'insurance'));
    `);
        console.log('✅ Added new constraint with license_back type');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

updateConstraint();
