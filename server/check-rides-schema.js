const { Client } = require('pg');

async function checkSchema() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: '8520894522',
        database: 'ride_andhra',
    });

    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        // Check rides table columns
        const ridesColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'rides'
      ORDER BY ordinal_position
    `);

        console.log('📋 Rides table columns:');
        ridesColumns.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
        });

        console.log('\n🔍 Checking for user_id and driver_id columns...');
        const hasUserId = ridesColumns.rows.some(r => r.column_name === 'user_id');
        const hasDriverId = ridesColumns.rows.some(r => r.column_name === 'driver_id');

        console.log(`  user_id: ${hasUserId ? '✅ EXISTS' : '❌ MISSING'}`);
        console.log(`  driver_id: ${hasDriverId ? '✅ EXISTS' : '❌ MISSING'}`);

        if (!hasUserId || !hasDriverId) {
            console.log('\n⚠️  Missing columns detected! Need to add them.');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

checkSchema();
