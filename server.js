'use strict';
const express = require("express");
const dotenv = require("dotenv");
const schedule = require("node-schedule");
const axios = require("axios");
const cheerio = require("cheerio");
const mysql = require("mysql");
const path = require('path');
const crawling = require("./public/getProducts");
const fs = require("fs");

const app = express();
dotenv.config({path: './.env'});

const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE
});

db.connect((error) => {
  if(error) {
    console.log(error);
  }
});

const publicDirectory = path.join(__dirname, './public');
app.use(express.static(publicDirectory));

app.use('/api', require('./routes/query'));

let nikeUpcomingUrl = "https://www.nike.com/kr/launch/?type=upcoming&activeDate=date-filter:AFTER_DATE";

async function scrapPage(url) {
  try {
    return await axios.get(url);
  }
  catch (error) {
    console.error(`${error}: cannot get html`);
  }
}

function getDrawInfoData(brandName) {
  let data = "";
  // const numdrawInfoSql = "SELECT type_name, sneakers_name FROM draw_info WHERE brand_name=?";
  const test = "SELECT * FROM draw_info";

  db.query(test, function(err, result) {
    if (err) {
      console.log(err);
    }
    else if (result.length === 0) {
      data = 0;
    }
    else {
      data = result[0];
    }
  });

  return data;
}

async function getSneakersInfo(drawList) {
  console.log("가져오는 중...");
  let products = [];

  for (let i = 0; i < drawList.length; i++) {
    let sneakers = await scrapPage(drawList[i].url);
    let $ = cheerio.load(sneakers.data);
    let sneakersInfo = $("aside.is-the-draw-start div");
    let imgInfo = $("div.prd-img-wrap");
    let priceReg = /\d+/g;
    let timeReg = /(\d{2}:\d{2})/g;
    let dateReg = /(\d{1,2})\/(\d{1,2})/g;

    let tempPrice = $(sneakersInfo).find('div.fs16-md').text();
    let resultPrice = tempPrice.match(priceReg);    //  100만원 까지 가는 제품은 구별 못함
    let price = resultPrice[0] + resultPrice[1];
    let releaseInfo = $(sneakersInfo).find('p.draw-info').text();

    let drawDateInfo = releaseInfo.match(dateReg);
    let drawTimeInfo = releaseInfo.match(timeReg);

    products[i] = {
      type: $(sneakersInfo).find('h1.pb3-sm').text(),
      name: $(sneakersInfo).find('h5.pb3-sm').text(),
      price: price,
      draw_date: drawDateInfo[0],
      draw_start_time: drawTimeInfo[0],
      draw_end_time: drawTimeInfo[1],
      announcement_time: drawTimeInfo[2],
      purchase_time: drawTimeInfo[3],
      url: drawList[i].url,
      img_url: $(imgInfo).find('img.image-component').attr('src')
    };
  }

  return products;
}

function loggingNumberDrawProducts(numberProducts) {
  const logPath = './config/Get-snkrs-info-log.txt';
  const date = new Date();
  const timeStamp = date.toLocaleString();
  const logData = `${timeStamp} THE DRAW products num: '${numberProducts}'\n`;

  fs.appendFile(logPath, logData, (err) => {
    if (err) {
      throw err;
    }
    else {
      console.log("Got number of products");
    }
  });
}

async function getDrawList() {
  const html = await scrapPage(nikeUpcomingUrl);
  let ulList = [];
  let drawList = [];
  let $ = cheerio.load(html.data);
  let bodyList = $("ul.gallery li");
  let strDraw = "THE DRAW 진행예정";

  bodyList.each(function(i, elem) {
    ulList[i] = {
      release_type: $(this).find('a.ncss-btn-primary-dark').text(),   //  Release type: Draw or Comming soon.
      url: $(this).find('a.comingsoon').attr('href')
    };

    // Check release type
    let hasDraw = ulList[i].release_type.indexOf(strDraw);

    if (hasDraw != -1) {
      let productUrl ="https://www.nike.com";

      productUrl += ulList[i].url;
      drawList.push({url: productUrl});
    }
  });

  return drawList;
}

async function main() {
  let products = [];
  let startTime = new Date();
  let drawList = await getDrawList();
  
  loggingNumberDrawProducts(drawList.length);
  products = await getSneakersInfo(drawList);

  let endTime = new Date();
  let resultRunningTime = (endTime - startTime) / 1000.0;
  let drawData = getDrawInfoData("nike");

  console.log(products);
  console.log(drawData);
  console.log(`It took ${resultRunningTime} seconds!!`);
}

async function test() {
  const fetchApi = '/api/get/draw_info';
  const response = await fetch(fetchApi);

  console.log(response);
}
// test();

main();

// let job = schedule.scheduleJob('45 * * * * *', async() => {
//   let drawList = await getDrawList();
//   loggingNumberDrawProducts(drawList.length);
// });

app.listen(3000, () => 
{
  console.log("Server is running like a Ninja");
});