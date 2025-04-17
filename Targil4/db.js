const sql = require('mssql');

const config = {
    user: 'Hadar_SQLLogin_2',
    password: 'v6mglbtege',
    server: 'groceryManagement.mssql.somee.com',
    database: 'groceryManagement',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};


async function connect() {
    try {
        const pool = await sql.connect(config);
        return pool;
    } catch (err) {
        console.error('DB connection failed:', err);
        throw err;
    }
}

module.exports = { connect, sql };
