const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:8520894522@localhost:5432/ride_andhra',
});

async function listUsersColumns() {
    try {
        await client.connect();
        console.log('Connected.');

        const res = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users';
    `);

        console.log("Users Table Columns:");
        res.rows.forEach(row => {
            console.log(`- ${row.column_name} (${row.data_type}, ${row.is_nullable})`);
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

listUsersColumns();
