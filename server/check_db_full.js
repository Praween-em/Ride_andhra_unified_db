const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:8520894522@localhost:5432/ride_andhra',
});

async function check() {
    try {
        await client.connect();
        const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'driver_profiles'");
        console.log('driver_profiles columns:');
        res.rows.forEach(r => console.log(`- ${r.column_name} (${r.data_type})`));

        const docs = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'driver_documents'");
        console.log('\ndriver_documents columns:');
        docs.rows.forEach(r => console.log(`- ${r.column_name} (${r.data_type})`));

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
check();
