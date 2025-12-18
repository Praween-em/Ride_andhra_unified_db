const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:8520894522@localhost:5432/ride_andhra',
});

async function fixEnum() {
    try {
        await client.connect();
        console.log('Connected to database to fix ENUMs.');

        // Attempt to add 'parcel'
        try {
            await client.query(`ALTER TYPE public.vehicle_type_enum ADD VALUE 'parcel'`);
            console.log("Added 'parcel' to enum.");
        } catch (e) {
            console.log("'parcel' might already exist or error:", e.message);
        }

        // Attempt to add 'bike_lite'
        try {
            await client.query(`ALTER TYPE public.vehicle_type_enum ADD VALUE 'bike_lite'`);
            console.log("Added 'bike_lite' to enum.");
        } catch (e) {
            console.log("'bike_lite' might already exist or error:", e.message);
        }

        console.log('Enum fix completed.');
    } catch (err) {
        console.error('Error fixing enum:', err);
    } finally {
        await client.end();
    }
}

fixEnum();
