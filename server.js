const express = require('express');
const mysql = require("mysql")
const dotenv = require('dotenv');
const app = express();

const db = mysql.createConnection ({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE
});

db.connect((error) => {
  if(error) {
    console.log(`${error} fuck~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`);
  }
  else {
    console.log("Nice job!");
  }
});

app.listen(4000, () =>
{
    console.log("Server is running like a Ninja");
});