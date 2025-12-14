const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '8520894522',
    database: 'ride_andhra',
});

async function testInsert() {
    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        // 1. Create a test user
        const userResult = await client.query(`
      INSERT INTO users (phone_number, name, role)
      VALUES ('+919999999999', 'Test Driver DB', 'driver')
      ON CONFLICT (phone_number) DO UPDATE SET name = 'Test Driver DB'
      RETURNING id, phone_number;
    `);
        const userId = userResult.rows[0].id;
        console.log('✅ User created/updated:', userResult.rows[0]);

        // 2. Try to insert into driver_profiles
        console.log('\n📝 Attempting to insert into driver_profiles...');
        const driverResult = await client.query(`
      INSERT INTO driver_profiles (
        user_id,
        first_name,
        last_name,
        vehicle_model,
        vehicle_color,
        vehicle_plate_number,
        vehicle_type
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7
      )
      ON CONFLICT (user_id) DO UPDATE 
      SET first_name = $2, last_name = $3
      RETURNING user_id, first_name, last_name;
    `, [userId, 'Test', 'Driver', 'Honda Activa', 'Blue', 'TEST1234', 'auto']);

        console.log('✅ Driver profile created:', driverResult.rows[0]);

        // 3. Try to insert into driver_documents
        console.log('\n📝 Attempting to insert into driver_documents...');
        const docResult = await client.query(`
      INSERT INTO driver_documents (
        driver_id,
        document_type,
        document_url,
        document_number,
        status
      ) VALUES (
        $1, $2, $3, $4, $5
      )
      ON CONFLICT (driver_id, document_type) DO UPDATE
      SET document_url = $3
      RETURNING id, driver_id, document_type;
    `, [userId, 'aadhar', '/uploads/test-aadhar.jpg', '1234-5678-9012', 'pending']);

        console.log('✅ Document created:', docResult.rows[0]);

        console.log('\n✅ All inserts successful! The database schema is working correctly.');
        console.log('   The issue must be with TypeORM entity configuration.');

    } catch (error) {
        console.error('\n❌ Database insert failed:');
        console.error('Error:', error.message);
        console.error('Detail:', error.detail);
        console.error('Hint:', error.hint);
    } finally {
        await client.end();
    }
}

testInsert();
