const express = require('express');
const mysql = require('mysql');
const dotenv = require('dotenv');
const logging = require('./log.js');
const port = process.env.PORT || 3000;
const app = express();

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
        console.log("Fuck Crash");
    }
});

app.use('/', require('./routes/controller'));

app.listen(port, () => {
    console.log('Server is running like a Ninja');
});