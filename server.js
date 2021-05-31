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
      draw_date: drawProducts[i].draw_date,
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

function setAlarm(todayDraw) {
  let drawStartTime = new Date(todayDraw[0].draw_start_time);
  let drawStartAlarm = schedule.scheduleJob(drawStartTime, () => {
    console.log(`${todayDraw[0].brand_name} ${todayDraw[0].type_name} ${todayDraw[0].sneakers_name} THE DRAW 가 시작되었습니다!`);
    // 여기서 푸쉬 들어가야함 그리고 그날 발매하는게 여러게면 아직 처리 안함
  });
  let startYear = drawStartTime.getFullYear();
  let startMonth = drawStartTime.getMonth();
  let startDate = drawStartTime.getDate();
  let startHours = drawStartTime.getHours();
  let startMinutes = drawStartTime.getMinutes();
  console.log(`Drarw 알람이 ${startYear}-${startMonth}-${startDate} ${startHours} : ${startMinutes} 에 설정되었습니다.`);

  //  확인하지 않았으면 중간에 한번 더 알려주는거 
  let drawEndTime = new Date(todayDraw[0].draw_end_time);
  let drawEndAlarm = schedule.scheduleJob(drawEndTime, () => {
    // 드로우 종료되었습니다.
    console.log("Draw가 종료되었습니다.");
    const DELETE_DRAW_SQL = "DELETE FROM draw_info WHERE id=?";

    db.query(DELETE_DRAW_SQL, [todayDraw[0].id], (err, complete) => {
      if (err) {
        console.log(err);
      }
      else {
        console.log("삭제 완료!!");
      }
    });
  });
}

function main(drawList) {
  let startTime = new Date();
  let drawData = [];
  let newProducts = [];
  let brandName = "Nike"; // re 나중에 여러 브랜드 일때
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

let checkNewDraw = schedule.scheduleJob('40 * * * * *', async() => {
  let drawList = await getDrawList("https://www.nike.com/kr/launch/", "Nike");
  let time = new Date();
  let minutes = (time.getMinutes() < 10) ? `0${time.getMinutes()}` : String(time.getMinutes());
  let hours = time.getHours() < 10 ? `0${time.getHours()}` : String(time.getHours());
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

      if (drawList.length === lastDrawCount) { // 이전 내용들을 지웠고 새로 추가할 draw정보가 없으면 log에 아무것도 남지 않음 그럼 다음 가져올때 문제생김
        loggingNumberDrawProducts(drawList.length);
      }
    }

    if (drawList.length != lastDrawCount) { 
      main(drawList);
      loggingNumberDrawProducts(drawList.length);
    }
    else {
      if(minutes % 15 == 0) {
        console.log(`Nothing changed / ${hours} : ${minutes}`);
      }
    }
  });
});

let checkAlarm = schedule.scheduleJob('15 0 0 * * *', () => {
  const day = new Date();
  let year = day.getFullYear();
  let month = day.getMonth() + 1;
  let date = day.getDate();
  const today = `${year}-${month}-${date}`;
  const DRAW_INFO_SQL = "SELECT * FROM draw_info WHERE draw_date=?";

  db.query(DRAW_INFO_SQL, [today], (err, data) => {
    if (err) {
      console.log(err);
    }
    else if (data.length === 0) {
      console.log("THE DRAW 예정이 없습니다.");
    }
    else {
      setAlarm(data);
    }
  });
});

app.listen(3000, () => {
  console.log("Server is running like a Ninja");
});