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
    console.log(`${error} Not conneted!!!!!!!!!!!!!!!!!!!`);
  }
  else {
    console.log("DB is connected");
  }
});

const getHtml = async () => {
  try {
    return await axios.get("https://www.nike.com/kr/launch/?type=upcoming&activeDate=date-filter:AFTER_DATE");
  } catch (error) {
    console.error(error);
  }
};

function formatData(item) {
  let formatTitle = "";
  let formatUrl = "www.nike.com";

  formatTitle = item.title.replace(/^\s+|\s+$/g,'');
  formatUrl += item.url;

  item = {
    title: formatTitle,
    url: formatUrl
  };

  return item;
}

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
      ulList[i] = formatData(ulList[i]);
    });

    for (let item of ulList) {
      if (item.title === "THE DRAW 진행예정") {
        drawList.push(item);
      }
    }

    console.log(drawList);
    console.log(drawList.length);
  });

app.listen(4000, () => {
  console.log("Server is running like a Ninja");
});