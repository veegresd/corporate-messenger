const { Pool } = require("pg");

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "corporate_messenger",
    password: "sigmaboy",
    port: 5432,
});

module.exports = pool;