/**
 * Database Query Script
 * Check the current state of driver_documents table
 */

const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '8520894522',
    database: 'ride_andhra',
});

async function checkDatabase() {
    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        // Check if driver_documents table exists
        const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'driver_documents'
      );
    `);
        console.log('📊 driver_documents table exists:', tableCheck.rows[0].exists);

        if (tableCheck.rows[0].exists) {
            // Get table structure
            const columns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'driver_documents'
        ORDER BY ordinal_position;
      `);
            console.log('\n📋 Table structure:');
            console.table(columns.rows);

            // Count documents
            const count = await client.query('SELECT COUNT(*) FROM driver_documents');
            console.log(`\n📊 Total documents: ${count.rows[0].count}`);

            // Show sample data
            const sample = await client.query('SELECT * FROM driver_documents LIMIT 5');
            if (sample.rows.length > 0) {
                console.log('\n📄 Sample data:');
                console.table(sample.rows);
            }
        }

        // Check drivers table columns
        console.log('\n📋 Checking drivers table columns:');
        const driverColumns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'driver_profiles'
      AND column_name IN ('aadhaar_photo', 'pan_photo')
      ORDER BY column_name;
    `);
        console.table(driverColumns.rows);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

checkDatabase();
