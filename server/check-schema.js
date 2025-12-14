const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '8520894522',
    database: 'ride_andhra',
});

async function checkSchema() {
    try {
        await client.connect();

        // Check if driver_app_drivers table exists (the one our entity is using)
        const driverAppDrivers = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'driver_app_drivers'
      ORDER BY ordinal_position;
    `);

        if (driverAppDrivers.rows.length > 0) {
            console.log('✅ driver_app_drivers table exists');
            console.log('Columns:', driverAppDrivers.rows.map(r => r.column_name).join(', '));
        } else {
            console.log('❌ driver_app_drivers table does NOT exist');
        }

        // Check driver_profiles
        const driverProfiles = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'driver_profiles'
      ORDER BY ordinal_position;
    `);

        if (driverProfiles.rows.length > 0) {
            console.log('\n✅ driver_profiles table exists');
            console.log('Columns:', driverProfiles.rows.map(r => r.column_name).join(', '));
        }

        // Check what driver_documents references
        const fks = await client.query(`
      SELECT
        kcu.column_name,
        ccu.table_name AS foreign_table,
        ccu.column_name AS foreign_column
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'driver_documents'
        AND kcu.column_name = 'driver_id';
    `);

        if (fks.rows.length > 0) {
            console.log('\n🔗 driver_documents.driver_id references:');
            console.log(`   ${fks.rows[0].foreign_table}.${fks.rows[0].foreign_column}`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

checkSchema();
