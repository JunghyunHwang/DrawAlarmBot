'use strict';
const EXPRESS = require("express");
const DOTENV = require("dotenv");
const SCHEDULE = require("node-schedule");
const AXIOS = require("axios");
const CHEERIO = require("cheerio");
const MYSQL = require("mysql");
const PATH = require('path');
const FS = require("fs");

const APP = EXPRESS();
DOTENV.config({PATH: './config/.env'});

const DB = MYSQL.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE
});

DB.connect((error) => {
  if(error) {
    console.log(error);
  }
});

async function scrapPage(url) {
  try {
    return await AXIOS.get(url);
  }
  catch (error) {
    console.error(`${error}: cannot get html!!!!!!!!!!!!!!!!`);
  }
}

async function getSneakersInfo(drawList) { // 지금은 나이키 아니면 동작 안함
  console.log("가져오는 중...");
  let products = [];

  for (let i = 0; i < drawList.length; i++) {
    let sneakers = await scrapPage(drawList[i].url);
    let $ = CHEERIO.load(sneakers.data);
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

  FS.appendFile(logPath, logData, (err) => {
    if (err) {
      throw err;
    }
    else {
      console.log("Got a number of products");
    }
  });
}

async function getDrawList(brandUrl, brandName) {
  const HTML = await scrapPage(brandUrl);
  let $ = CHEERIO.load(HTML.data);
  let drawList = [];
  let bodyList = $("ul.gallery li");
  let strDraw = "THE DRAW 진행예정";  //응모중에는 'THE DRAW 응모하기 / 응모 끝나면 THE DRAW 응모 마감'

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

async function insertNewProducts(newProducts) {
  console.log("데이터 베이스에 저장 중...");
  
  for (let i = 0; i < newProducts.length; i++) {
    const INSERT_PRODUCT_SQL = "INSERT INTO draw_info SET ?";

    DB.query(INSERT_PRODUCT_SQL, {
      brand_name: newProducts[i].brand_name, 
      type_name: newProducts[i].type_name, 
      sneakers_name: newProducts[i].sneakers_name, 
      product_price: newProducts[i].price, 
      product_url: newProducts[i].url, 
      draw_date: newProducts[i].draw_date,
      draw_start_time: newProducts[i].draw_start_time,
      draw_end_time: newProducts[i].draw_end_time, 
      winner_announcement_time: newProducts[i].announcement_time, 
      purchase_time: newProducts[i].purchase_time
    }, (err, inserResult) => {
      if (err) {
        console.log(err);
      }
      else {
        console.log("새로운 Draw 저장 완료!!");
        //  만약 시간이 09 : 00 ~ 21 : 00 면 바로 알림
      }
    });
  }
}

function setAlarm(todayDraw) {
  let drawStartTime = new Date(todayDraw.draw_start_time);
  let drawStartAlarm = SCHEDULE.scheduleJob(drawStartTime, () => {
    console.log(`${todayDraw.brand_name} ${todayDraw.type_name} ${todayDraw.sneakers_name} THE DRAW 가 시작되었습니다!`);
    //  notification (Draw종료 시간, 몇분 동안 진행?, 당첨자 발표 시간 url)
  });
  let startYear = drawStartTime.getFullYear();
  let startMonth = drawStartTime.getMonth() + 1;
  let startDate = drawStartTime.getDate();
  let startHours = drawStartTime.getHours() < 10 ? `0${drawStartTime.getHours()}` : drawStartTime.getHours();
  let startMinutes = drawStartTime.getMinutes() < 10 ? `0${drawStartTime.getMinutes()}` : drawStartTime.getMinutes();
  console.log(`Drarw 알람이 ${startYear}-${startMonth}-${startDate} / ${startHours} : ${startMinutes} 에 설정되었습니다.`);

  //  확인하지 않았으면 중간에 한번 더 알려주는거 
  let drawEndTime = new Date(todayDraw.draw_end_time);
  let drawEndAlarm = SCHEDULE.scheduleJob(drawEndTime, () => {
    // 드로우 종료되었습니다.
    console.log(`${todayDraw.brand_name} ${todayDraw.type_name} ${todayDraw.sneakers_name}의 Draw가 종료되었습니다.`);
    const DELETE_DRAW_SQL = "DELETE FROM draw_info WHERE id=?";

    DB.query(DELETE_DRAW_SQL, [todayDraw.id], (err, complete) => {
      if (err) {
        console.log(err);
      }
      else {
        console.log("삭제 완료!!");
      }
    });
  });
}

function getDrawDatas(drawList) {
  let drawData = [];
  let newProducts = [];
  let brandName = "Nike"; // re 나중에 여러 브랜드 일때
  const DRAW_INFO_SQL = "SELECT type_name, sneakers_name FROM draw_info WHERE brand_name=?";

  DB.query(DRAW_INFO_SQL, [brandName], async(err, result) => {
    if (err) {
      console.log(err);
    }
    else if (result.length === 0) {
      insertNewProducts(await getSneakersInfo(drawList));
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
    
      if(newProducts.length) {
        insertNewProducts(await getSneakersInfo(newProducts));
      }
      else {
        console.log("저장 할게 없어");
      }
    }
  });
}

let checkNewDrawsEveryMinutes = SCHEDULE.scheduleJob('40 * * * * *', async() => {
  let startTime = new Date();
  let drawList = await getDrawList("https://www.nike.com/kr/launch/", "Nike");
  const NUMBER_OF_DRAW_DATA_SQL = "SELECT COUNT(*) FROM draw_info WHERE brand_name=?";
  
  DB.query(NUMBER_OF_DRAW_DATA_SQL, ["Nike"], (err, drawData) => {
    if (err) {
      console.log(err);
    }
    else {
      if (drawList.length != drawData[0]['COUNT(*)']) {
        getDrawDatas(drawList);
      }
      else {
        let endTime = new Date();
        let resultTime = (endTime - startTime) / 1000;
        console.log(`${resultTime}초 걸림!`);
        console.log("Nothing changed");
      }
    }
  });
});

let checkNewDrawsEveryday = SCHEDULE.scheduleJob('0 10 0 * * *', async() => {
  let drawList = await getDrawList("https://www.nike.com/kr/launch/", "Nike");
  getDrawDatas(drawList);
});

let checkTodayDraw = SCHEDULE.scheduleJob('0 15 0 * * *', () => {
  const DAY = new Date();
  const TODAY = `${DAY.getFullYear()}-${DAY.getMonth() + 1}-${DAY.getDate()}`;
  const DRAW_INFO_SQL = "SELECT * FROM draw_info WHERE draw_date=?";

  DB.query(DRAW_INFO_SQL, [TODAY], (err, todayDrawDatas) => {
    if (err) {
      console.log(err);
    }
    else if (todayDrawDatas.length === 0) {
      console.log(`${TODAY} THE DRAW 예정이 없습니다.`);
    }
    else {
      for (let data of todayDrawDatas) {
        setAlarm(data);
      }
    }
  });
});

APP.listen(3000, () => {
  console.log("Server is running like a Ninja");
});