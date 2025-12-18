const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:8520894522@localhost:5432/ride_andhra',
});

async function seed() {
    try {
        await client.connect();
        console.log('Connected to database.');

        // Ensure the table exists (Sync should have done it, but just in case)
        // We rely on the server running with DB_SYNCHRONIZE=true to create constraints/enums.
        // But we can just try to insert.

        const queries = [
            `INSERT INTO fare_settings (vehicle_type, base_fare, per_km_rate, per_minute_rate, minimum_fare, surge_multiplier, is_active)
       VALUES ('bike', 20.00, 5.00, 1.00, 30.00, 1.0, true)
       ON CONFLICT (vehicle_type) DO UPDATE SET base_fare = EXCLUDED.base_fare;`,

            `INSERT INTO fare_settings (vehicle_type, base_fare, per_km_rate, per_minute_rate, minimum_fare, surge_multiplier, is_active)
       VALUES ('auto', 30.00, 10.00, 1.50, 40.00, 1.0, true)
       ON CONFLICT (vehicle_type) DO UPDATE SET base_fare = EXCLUDED.base_fare;`,

            `INSERT INTO fare_settings (vehicle_type, base_fare, per_km_rate, per_minute_rate, minimum_fare, surge_multiplier, is_active)
       VALUES ('car', 50.00, 15.00, 2.00, 80.00, 1.0, true)
       ON CONFLICT (vehicle_type) DO UPDATE SET base_fare = EXCLUDED.base_fare;`,

            `INSERT INTO fare_settings (vehicle_type, base_fare, per_km_rate, per_minute_rate, minimum_fare, surge_multiplier, is_active)
       VALUES ('premium', 80.00, 20.00, 3.00, 100.00, 1.0, true)
       ON CONFLICT (vehicle_type) DO UPDATE SET base_fare = EXCLUDED.base_fare;`,

            `INSERT INTO fare_settings (vehicle_type, base_fare, per_km_rate, per_minute_rate, minimum_fare, surge_multiplier, is_active)
       VALUES ('parcel', 25.00, 6.00, 1.00, 35.00, 1.0, true)
       ON CONFLICT (vehicle_type) DO UPDATE SET base_fare = EXCLUDED.base_fare;`,

            `INSERT INTO fare_settings (vehicle_type, base_fare, per_km_rate, per_minute_rate, minimum_fare, surge_multiplier, is_active)
       VALUES ('bike_lite', 15.00, 4.00, 0.50, 20.00, 1.0, true)
       ON CONFLICT (vehicle_type) DO UPDATE SET base_fare = EXCLUDED.base_fare;`
        ];

        for (const query of queries) {
            await client.query(query);
        }

        console.log('Seeding completed successfully.');
    } catch (err) {
        console.error('Error seeding data:', err);
    } finally {
        await client.end();
    }
}

seed();
