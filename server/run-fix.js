const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '8520894522',
    database: 'ride_andhra',
});

async function fixSchema() {
    try {
        await client.connect();
        console.log('✅ Connected to database');

        const sql = fs.readFileSync(path.join(__dirname, 'fix-schema.sql'), 'utf8');
        await client.query(sql);
        console.log('✅ Schema fixed successfully');

    } catch (error) {
        console.error('❌ Error fixing schema:', error.message);
    } finally {
        await client.end();
    }
}

fixSchema();
