const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:8520894522@localhost:5432/ride_andhra',
});

async function inspectSchema() {
    try {
        await client.connect();
        console.log('Connected to database.');

        const res = await client.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'fare_settings' AND column_name = 'vehicle_type';
    `);

        console.log("Column Info:", res.rows);

    } catch (err) {
        console.error('Error inspecting schema:', err);
    } finally {
        await client.end();
    }
}

inspectSchema();
