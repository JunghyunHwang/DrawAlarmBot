'use strict';
const express = require("express");
const dotenv = require("dotenv");
const schedule = require("node-schedule");
const axios = require("axios");
const cheerio = require("cheerio");
const mysql = require("mysql");
const path = require('path');
const crawling = require("./crawling/crawling.js");
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
      type: drawList[i].type_name,
      name: drawList[i].sneakers_name,
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

async function getDrawList(brandUrl) {
  const HTML = await scrapPage(brandUrl);
  let ulList = [];
  let drawList = [];
  let $ = cheerio.load(HTML.data);
  let bodyList = $("ul.gallery li");
  let strDraw = "THE DRAW 진행예정";

  bodyList.each(function(i, elem) {
    ulList[i] = {
      release_type: $(this).find('a.ncss-btn-primary-dark').text(),   //  Release type: Draw or Comming soon.
    };

    // Check release type
    let hasDraw = ulList[i].release_type.indexOf(strDraw);

    if (hasDraw != -1) {
      let productUrl = "https://www.nike.com";
      productUrl += $(this).find('a.comingsoon').attr('href');

      let product = {
        type_name: $(this).find('h3.headline-5').text(),
        sneakers_name: $(this).find('h6.headline-3').text(),
        url: productUrl
      }
      drawList.push(product);
    }
  });

  return drawList;
}

function getDrawInfo() {
  db.query(DRAW_INFO_SQL, [url], (err, result) => {
    if (err) {
      console.log(err);
    }
    else if (result.length === 0) {
      if (drawList.length) {
        // insert data
      }
    }
    else {  // DateTime 값 넣을때 형싱 : yy-mm-dd 00:00:00 이런식으로 formatting 해서 넣어!
      drawData = result;

      for (let i = 0; i < products.length; i++) {
        if (drawData.indexOf(products[i]) < 0) {  // 한번 더 검증 필요 이름은 같은데 타입이 다르던가 반대던가
          const INSERT_PRODUCT_SQL = "INSERT INTO draw_info SET ?";

          db.query(INSERT_PRODUCT_SQL, {
            brand_name: "Nike", 
            type_name: products[i].type, 
            sneakers_name: products[i].name, 
            product_price: products[i].price, 
            product_url: products[i].url, 
            draw_start_time: products[i].draw_start_time,   // products draw time fomatting 다시 해야 함
            draw_end_time: products[i].draw_end_time, 
            winner_announcement_time: products[i].announcement_time, 
            purchase_time: products[i].purchase_time
          }, (err, inserResult) => {
            if (err) {
              console.log(err);
            }
          });
          newProducts.push(products[i]);
        }
      }
    }
  });
}

async function main() {
  let products = [];
  let brands = {
    Nike: "https://www.nike.com/kr/launch/"
  };
  let startTime = new Date();
  let newProducts = [];
  
  for (let url in brands) {
    let drawList = await getDrawList(brands[url]);
    if (drawList.length === 0) {
      continue;
    }

    let drawData = [];
    const DRAW_INFO_SQL = "SELECT type_name, sneakers_name FROM draw_info WHERE?";

    db.query(DRAW_INFO_SQL, [url], (err, result) => {
      if (err) {
        console.log(err);
      }
      else if(result.length === 0) {
        for (let i = 0; i < drawList.length; i++) {
          newProducts.push(drawList[i]);
        }
      }
      else {
        drawData = result;  // 이거 해야 함?

        for (let i = 0; i < drawList.length; i++) {
          if (drawData.indexOf(drawList[i]) < 0) { // drawList에 원래 DB에 있는 값 넣어서 잘 작동하는지 확인
            newProducts.push(drawList[i]);
          }
        }
      }
    });
  }

  // products = await getSneakersInfo(newProducts);
  // inset data
  // loggingNumberDrawProducts(drawList.length);
  // let endTime = new Date();
  // let resultRunningTime = (endTime - startTime) / 1000.0;
  // console.log(`It took ${resultRunningTime} seconds!!`);
}

main();

// let job = schedule.scheduleJob('45 * * * * *', async() => {
//   let drawList = await getDrawList();
//   loggingNumberDrawProducts(drawList.length);
// });

app.listen(3000, () => 
{
  console.log("Server is running like a Ninja");
});