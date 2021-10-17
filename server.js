const express = require('express');
const dotenv = require('dotenv');
const port = process.env.PORT || 3000;
const app = express();

dotenv.config();

app.use('/', require('./routes/controller'));

app.listen(port, () => {
    console.log('Server is running like a Ninja');
});