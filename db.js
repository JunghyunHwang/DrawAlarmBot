const dotenv = require('dotenv');
const mysql = require('mysql');
const logging = require('./log');
dotenv.config();

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

db.connect((error) => {
    if (error) {
        logging('error', "DB disconnected");
    }
});

module.exports = db;