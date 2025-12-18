const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:8520894522@localhost:5432/ride_andhra',
});

async function checkEnum() {
    try {
        await client.connect();
        console.log('Connected.');

        const res = await client.query(`
      SELECT unnest(enum_range(NULL::vehicle_type_enum)) as value
    `);

        console.log("Enum Values:", res.rows.map(r => r.value));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkEnum();
