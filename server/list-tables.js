const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '8520894522',
    database: 'ride_andhra',
});

async function listTables() {
    try {
        await client.connect();
        const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.table(res.rows);
    } catch (error) {
        console.error(error);
    } finally {
        await client.end();
    }
}

listTables();
