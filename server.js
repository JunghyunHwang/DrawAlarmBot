const express = require('express');
const mysql = require('mysql');
const dotenv = require('dotenv');
const logging = require('./log.js');
const port = process.env.PORT || 3000;
const app = express();

dotenv.config();

app.use('/', require('./routes/controller'));

app.listen(port, () => {
    console.log('Server is running like a Ninja');
});