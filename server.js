const express = require('express');
const mysql = require('mysql');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

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
    }
});

app.use('/', require('./routes/controller'));

app.listen(3000, () => {
    console.log('Server is running like a Ninja');
});