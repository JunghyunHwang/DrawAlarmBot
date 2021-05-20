'use strict';
const express = require("express");
const mysql = require("mysql")
const dotenv = require("dotenv");
const app = express();
const getHtml = require('./getData/getHtml.js');

dotenv.config({path: './.env'});

const db = mysql.createConnection ({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE
});

db.connect((error) => {
  if (error) {
    console.log(`${error} Not conneted!!!!!!!!!!!!!!!!!!!`);
  }
  else {
    console.log("DB is connected");
  }
});

let startTime = new Date();
getHtml.getProducts(startTime);

app.listen(3000, () => {
  console.log("Server is running like a Ninja");
});