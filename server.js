const express = require('express');
const mysql = require('mysql');
const dotenv = require('dotenv');
const logging = require('./log.js');
const port = process.env.PORT || 3000;
const app = express();
const db = require('./db.js');

dotenv.config();

db.query('SELECT * FROM draw_info', (err, row) => {
    if (err) {
        console.log(err);
    }
    else {
        console.log(row);
    }
});

app.use('/', require('./routes/controller'));

app.listen(port, () => {
    console.log('Server is running like a Ninja');
});