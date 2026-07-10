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
    console.log("PostgreSQL connected");
});


pool.on("error", (err) => {
    console.error("Database error:", err);
});


module.exports = pool;
