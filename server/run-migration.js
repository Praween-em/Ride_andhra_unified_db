const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: '8520894522',
        database: 'ride_andhra',
    });

    try {
        await client.connect();
        console.log('✅ Connected to database');

        // Read the migration file
        const migrationPath = path.join(__dirname, 'database', 'migrations', '002_ride_notification_trigger.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('📝 Running migration: 002_ride_notification_trigger.sql');

        // Execute the migration
        await client.query(migrationSQL);

        console.log('✅ Migration completed successfully!');

        // Verify the table was created
        const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'ride_rejections'
    `);

        if (tableCheck.rows.length > 0) {
            console.log('✅ Table "ride_rejections" created successfully');
        }

        // Verify the trigger was created
        const triggerCheck = await client.query(`
      SELECT trigger_name 
      FROM information_schema.triggers 
      WHERE event_object_table = 'rides' 
      AND trigger_name = 'ride_created_trigger'
    `);

        if (triggerCheck.rows.length > 0) {
            console.log('✅ Trigger "ride_created_trigger" created successfully');
        }

        // Verify the function was created
        const functionCheck = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_name = 'notify_new_ride'
    `);

        if (functionCheck.rows.length > 0) {
            console.log('✅ Function "notify_new_ride" created successfully');
        }

        console.log('\n🎉 Database migration complete!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        if (error.message.includes('already exists')) {
            console.log('ℹ️  Migration may have already been applied');
        }
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
