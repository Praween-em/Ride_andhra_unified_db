const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:8520894522@localhost:5432/ride_andhra',
});

async function listFares() {
    try {
        await client.connect();
        console.log('Connected.');

        const res = await client.query(`SELECT vehicle_type, base_fare FROM fare_settings`);
        console.log("Existing Fares:", res.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

listFares();
