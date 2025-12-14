const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

async function checkIsOnlineColumn() {
    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        // Check if is_online column exists
        const columnCheck = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'driver_profiles' 
      AND column_name = 'is_online'
    `);

        console.log('📋 Column Info:');
        console.log(JSON.stringify(columnCheck.rows, null, 2));
        console.log('');

        // Check current values
        const dataCheck = await client.query(`
      SELECT user_id, first_name, is_online, current_latitude, current_longitude
      FROM driver_profiles
      LIMIT 5
    `);

        console.log('📊 Current Data (first 5 drivers):');
        console.log(JSON.stringify(dataCheck.rows, null, 2));
        console.log('');

        // Try to update a test record
        const testUpdate = await client.query(`
      UPDATE driver_profiles 
      SET is_online = true 
      WHERE user_id = (SELECT user_id FROM driver_profiles LIMIT 1)
      RETURNING user_id, is_online
    `);

        console.log('🔄 Test Update Result:');
        console.log(JSON.stringify(testUpdate.rows, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await client.end();
    }
}

checkIsOnlineColumn();
