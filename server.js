'use strict';
const express = require("express");
const dotenv = require("dotenv");
const schedule = require("node-schedule");
const axios = require("axios");
const cheerio = require("cheerio");
const mysql = require("mysql");
const path = require('path');
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

async function scrapPage(url) {
  try {
    return await axios.get(url);
  }
  catch (error) {
    console.error(`${error}: cannot get html`);
  }
}

async function getSneakersInfo(drawList) { // 지금은 나이키 아니면 동작 안함
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
    let resultPrice = tempPrice.match(priceReg);    //  100만원 하는 신발은 구별 못함
    let price = resultPrice[0] + resultPrice[1];
    let releaseInfo = $(sneakersInfo).find('p.draw-info').text();

    let drawTimeInfo = releaseInfo.match(timeReg);
    let dateRegResult = dateReg.exec(releaseInfo);
    let currentDate = new Date();
    let years = currentDate.getFullYear();  // 다음해로 넘어가는 12월에 문제 생길 가능성 있음
    let month = dateRegResult[1];
    let date = dateRegResult[2];
    
    let drawDateInfo = `${years}-${month}-${date}`;

    products[i] = {
      brand_name: drawList[i].brand_name,
      type_name: drawList[i].type_name,
      sneakers_name: drawList[i].sneakers_name,
      price: price,
      draw_date: drawDateInfo,
      draw_start_time: `${drawDateInfo} ${drawTimeInfo[0]}`,
      draw_end_time: `${drawDateInfo} ${drawTimeInfo[1]}`,
      announcement_time: `${drawDateInfo} ${drawTimeInfo[2]}`,
      purchase_time: `${drawDateInfo} ${drawTimeInfo[3]}`,
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
  const logData = `${timeStamp} THE DRAW products num: \n${numberProducts}\n`;

  fs.appendFile(logPath, logData, (err) => {
    if (err) {
      throw err;
    }
    else {
      console.log("Got number of products");
    }
  });
}

async function getDrawList(brandUrl, brandName) {
  const HTML = await scrapPage(brandUrl);
  let drawList = [];
  let $ = cheerio.load(HTML.data);
  let bodyList = $("ul.gallery li");
  let strDraw = "THE DRAW 진행예정";

  bodyList.each(function(i, elem) {
    let releaseType = $(this).find('div.ncss-btn-primary-dark').text();

    // Check release type
    if (releaseType.indexOf(strDraw) != -1) {
      let productUrl = "https://www.nike.com";
      productUrl += $(this).find('a.comingsoon').attr('href');
      
      let product = {
        brand_name: brandName,
        type_name: $(this).find('h3.headline-5').text(),
        sneakers_name: $(this).find('h6.headline-3').text(),
        url: productUrl
      };
      drawList.push(product);
    }
  });

  return drawList;
}

function insertDrawInfo(drawProducts) {
  console.log("데이터 베이스에 저장 중...");
  
  for (let i = 0; i < drawProducts.length; i++) {
    const INSERT_PRODUCT_SQL = "INSERT INTO draw_info SET ?";

    db.query(INSERT_PRODUCT_SQL, {
      brand_name: drawProducts[i].brand_name, 
      type_name: drawProducts[i].type_name, 
      sneakers_name: drawProducts[i].sneakers_name, 
      product_price: drawProducts[i].price, 
      product_url: drawProducts[i].url, 
      draw_start_time: drawProducts[i].draw_start_time,
      draw_end_time: drawProducts[i].draw_end_time, 
      winner_announcement_time: drawProducts[i].announcement_time, 
      purchase_time: drawProducts[i].purchase_time
    }, (err, inserResult) => {
      if (err) {
        console.log(err);
      }
      else {
        console.log("새로운 Draw 저장 완료!!");
      }
    });
  }

  return;
}

async function getProductInfo(newProducts) {
  let drawProducts = await getSneakersInfo(newProducts);
  insertDrawInfo(drawProducts);

  return;
}

function main(drawList) {
  let startTime = new Date();
  let drawData = [];
  let newProducts = [];
  let brandName = "Nike";
  const DRAW_INFO_SQL = "SELECT type_name, sneakers_name FROM draw_info WHERE brand_name=?";

  db.query(DRAW_INFO_SQL, [brandName], (err, result) => {
    if (err) {
      console.log(err);
    }
    else if(result.length === 0) {
      getProductInfo(drawList);
    }
    else {
      for (let i = 0; i < result.length; i++) { // 줄일 수 있으면 줄여봐
        drawData[i] = `${result[i].type_name} ${result[i].sneakers_name}`;
      }

      for (let i = 0; i < drawList.length; i++) {
        let name = `${drawList[i].type_name} ${drawList[i].sneakers_name}`;

        if (drawData.indexOf(name) < 0) { 
          newProducts.push(drawList[i]);
        }
      }
    
      if(newProducts.length) {  // 하나씩 보내면 어떨까?
        getProductInfo(newProducts);
      }
      else {
        console.log("저장 할게 없어");
      }

      let endTime = new Date();
      let resultRunningTime = (endTime - startTime) / 1000.0;
      console.log(`It took ${resultRunningTime} seconds!!`);
    }
  });
}

let checkDraw = schedule.scheduleJob('40 * * * * *', async () => {
  let drawList = await getDrawList("https://www.nike.com/kr/launch/", "Nike");

  let lastDrawCount = 0;
  const logPath = './config/Get-snkrs-info-log.txt';

  fs.readFile(logPath, 'utf8', (err, data) => {
    if (err) {
      console.log(err);
    }

    let array = data.toString().split("\n");
    let lastDrawlen = array.length - 2;
    lastDrawCount = Number(array[lastDrawlen]);
    
    if (array.length > 200) {
      fs.writeFile(logPath, "", 'utf8', (err) => {
        if (err) throw err;
      });
    }

    if (drawList.length != lastDrawCount) {
      main(drawList);
      loggingNumberDrawProducts(drawList.length);
    }
    else {
      console.log("Nothing changed!");
    }
  });
});

app.listen(3000, () => 
{
  console.log("Server is running like a Ninja");
});