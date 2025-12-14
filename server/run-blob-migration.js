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

async function runMigration() {
    try {
        await client.connect();
        console.log('✅ Connected to database');

        const sql = fs.readFileSync(
            path.join(__dirname, 'src/database/migrations/005_update_driver_documents_blob.sql'),
            'utf8'
        );

        await client.query(sql);
        console.log('✅ Migration 005 completed successfully');
        console.log('   - driver_documents table updated to store images as BLOB');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        await client.end();
    }
}

runMigration();
