/**
 * Migration Runner Script
 * Run this script to execute SQL migrations on the database
 * 
 * Usage: node run-migrations.js
 */

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

async function runMigrations() {
    try {
        await client.connect();
        console.log('✅ Connected to database');

        // Migration files in order
        const migrations = [
            '003_create_driver_documents_table.sql',
            '004_migrate_driver_documents_data.sql',
        ];

        for (const migrationFile of migrations) {
            const migrationPath = path.join(__dirname, 'src', 'database', 'migrations', migrationFile);

            if (!fs.existsSync(migrationPath)) {
                console.log(`⚠️  Migration file not found: ${migrationFile}`);
                continue;
            }

            console.log(`\n📄 Running migration: ${migrationFile}`);
            const sql = fs.readFileSync(migrationPath, 'utf8');

            try {
                await client.query(sql);
                console.log(`✅ Successfully executed: ${migrationFile}`);
            } catch (error) {
                console.error(`❌ Error executing ${migrationFile}:`, error.message);
                // Continue with other migrations even if one fails
            }
        }

        console.log('\n✅ All migrations completed!');
    } catch (error) {
        console.error('❌ Migration error:', error);
    } finally {
        await client.end();
        console.log('✅ Database connection closed');
    }
}

runMigrations();
