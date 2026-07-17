const { Pool, types } = require("pg");
require("dotenv").config();

// Parse DATE columns (OID 1082) as raw strings (YYYY-MM-DD) to prevent automatic conversion to local/UTC timestamps
types.setTypeParser(1082, (val) => val);


const pool = new Pool({

    host: process.env.DB_HOST,

    port: process.env.DB_PORT,

    database: process.env.DB_NAME,

    user: process.env.DB_USER,

    password: process.env.DB_PASSWORD

});


pool.on("connect", () => {
    // Connection established
});


pool.on("error", (err) => {
    console.error("Database error:", err);
});


/**
 * Test the database connection and report a clear status.
 * Call this at server startup to verify PostgreSQL is reachable.
 */
async function checkDatabaseConnection() {
    const config = {
        host: process.env.DB_HOST || '(not set)',
        port: process.env.DB_PORT || '(not set)',
        database: process.env.DB_NAME || '(not set)',
        user: process.env.DB_USER || '(not set)',
    };

    console.log(`\n🔍 Database connection check...`);
    console.log(`   Host: ${config.host}:${config.port}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   User: ${config.user}`);

    try {
        const result = await pool.query("SELECT NOW() AS server_time, current_database() AS db_name");
        const { server_time, db_name } = result.rows[0];
        console.log(`✅ PostgreSQL connected successfully`);
        console.log(`   Server time: ${server_time}`);
        console.log(`   Database: ${db_name}\n`);
        return true;
    } catch (err) {
        console.error(`\n❌ PostgreSQL connection FAILED`);

        if (err.code === 'ECONNREFUSED') {
            console.error(`   ⛔ Connection refused at ${config.host}:${config.port}`);
            console.error(`   → PostgreSQL is NOT running or not accepting connections`);
            console.error(`   → Fix: sudo pg_ctlcluster 18 main start`);
        } else if (err.code === '28P01') {
            console.error(`   🔑 Authentication failed for user "${config.user}"`);
            console.error(`   → Check DB_USER and DB_PASSWORD in your .env file`);
        } else if (err.code === '3D000') {
            console.error(`   📁 Database "${config.database}" does not exist`);
            console.error(`   → Check DB_NAME in your .env file or create the database`);
        } else if (err.code === 'ETIMEDOUT') {
            console.error(`   ⏱️  Connection timed out to ${config.host}:${config.port}`);
            console.error(`   → Check DB_HOST and DB_PORT in your .env file`);
        } else {
            console.error(`   Error code: ${err.code || 'unknown'}`);
            console.error(`   Message: ${err.message}`);
        }

        console.error('');
        return false;
    }
}


module.exports = pool;
module.exports.checkDatabaseConnection = checkDatabaseConnection;
