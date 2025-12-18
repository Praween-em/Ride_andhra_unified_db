const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:8520894522@localhost:5432/ride_andhra',
});

async function checkTable() {
    try {
        await client.connect();
        console.log('Connected.');

        const res = await client.query(`
      SELECT to_regclass('public.fare_settings') as table_exists;
    `);

        console.log("Table 'fare_settings' exists:", !!res.rows[0].table_exists);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkTable();
