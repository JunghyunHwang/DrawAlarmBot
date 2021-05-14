const express = require("express");
const mysql = require("mysql")
const dotenv = require("dotenv");
const axios = require("axios");
const cheerio = require("cheerio");
const app = express();

dotenv.config({path: './.env'});

const db = mysql.createConnection ({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE
});

db.connect((error) => {
  if (error) {
    console.log(error);
  }
});

const getHtml = async () => {
  try {
    return await axios.get("https://www.nike.com/kr/launch/?type=upcoming&activeDate=date-filter:AFTER_DATE");
  } catch (error) {
    console.error(error);
  }
};

getHtml()
  .then(html => {
    let ulList = [];
    let drawList = [];
    const $ = cheerio.load(html.data);
    const $bodyList = $("ul.gallery li");

    $bodyList.each(function (i, elem) {
      ulList[i] = {
        title: $(this).find('div.ta-sm-c a').text(),
        url: $(this).find('a.comingsoon').attr('href')
      }; 
    });
    console.log(ulList);

    /*
    let cnt = 0;
    for (let i = 0; i < ulList.length; i++) {
      if (ulList[i].title == "THE DRAW 진행예정") {
        cnt++;
      }
    }
    console.log(cnt);
    */
  });

app.listen(4000, () => {
  console.log("Server is running like a Ninja");
});