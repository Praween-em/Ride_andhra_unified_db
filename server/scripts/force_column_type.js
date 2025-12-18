const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:8520894522@localhost:5432/ride_andhra',
});

async function forceType() {
    try {
        await client.connect();
        console.log('Connected.');

        // Force the column to use the enum we know we fixed
        await client.query(`
      ALTER TABLE fare_settings 
      ALTER COLUMN vehicle_type 
      TYPE vehicle_type_enum 
      USING vehicle_type::text::vehicle_type_enum;
    `);

        console.log("Column type fixed to vehicle_type_enum.");

    } catch (err) {
        console.error('Error forcing type:', err);
    } finally {
        await client.end();
    }
}

forceType();
