const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:8520894522@localhost:5432/ride_andhra',
});

async function debug() {
    try {
        await client.connect();
        console.log('Connected.');

        // Test 1: Can we cast the string to the enum type?
        try {
            const res = await client.query(`SELECT 'parcel'::vehicle_type_enum as val`);
            console.log("Test 1 (Cast): Success", res.rows[0]);
        } catch (e) {
            console.log("Test 1 (Cast): Failed", e.message);
        }

        // Test 2: Check the column type of fare_settings.vehicle_type again
        const res2 = await client.query(`
        SELECT column_name, udt_name 
        FROM information_schema.columns 
        WHERE table_name = 'fare_settings' AND column_name = 'vehicle_type'
    `);
        console.log("Test 2 (Column Type path):", res2.rows);

        // Test 3: Try to insert into the table directly with explicit cast
        try {
            await client.query(`
            INSERT INTO fare_settings (vehicle_type, base_fare, per_km_rate, per_minute_rate, minimum_fare, surge_multiplier, is_active)
            VALUES ('parcel'::vehicle_type_enum, 25.00, 6.00, 1.00, 35.00, 1.0, true)
        `);
            console.log("Test 3 (Insert with cast): Success");
        } catch (e) {
            console.log("Test 3 (Insert with cast): Failed", e.message);
        }

    } catch (err) {
        console.error('Global Error:', err);
    } finally {
        await client.end();
    }
}

debug();
