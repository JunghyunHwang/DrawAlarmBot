const express = require('express');
const mysql = require('mysql');
const dotenv = require('dotenv');
const logging = require('./log.js');
const port = process.env.PORT || 3000;
const app = express();
const db = require('./db.js');

dotenv.config();

function handleDisconnect() {
    db.connect(function(err) {
        if(err) {
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000);
        }
    });
    db.on('error', function(err) {
        console.log('db error', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect();
        } 
        else {
            throw err;
        }
    });
}

handleDisconnect();

app.use('/', require('./routes/controller'));

app.listen(port, () => {
    console.log('Server is running like a Ninja');
});