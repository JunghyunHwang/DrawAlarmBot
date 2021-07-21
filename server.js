'use strict';
const EXPRESS = require("express");
const dotenv = require("dotenv");
const SCHEDULE = require("node-schedule");
const AXIOS = require("axios");
const CHEERIO = require("cheerio");
const MYSQL = require("mysql");
const path = require('path');
const FS = require("fs");
const assert = require("assert");
const { Console } = require("console");
const Draw = require("./Draw");

const APP = EXPRESS();
dotenv.config({ path: './config/.env' });

const DB = MYSQL.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE
});

DB.connect((error) => {
  if (error) {
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

async function getSneakersInfo(drawList) { // 지금은 나이키 아니면 동작 안함
  console.log("가져오는 중...");
  let products = [];

  for (let i = 0; i < drawList.length; i++) {
    let sneakers = await scrapPage(drawList[i].url);
    let $ = CHEERIO.load(sneakers.data);
    let sneakersInfo = $("aside.is-the-draw-start div");
    let imgInfo = $("div.prd-img-wrap");
    let priceRegex = /\d+/g;
    let timeRegex = /(\d{2}:\d{2})/g;
    let dateRegex = /(\d{1,2})\/(\d{1,2})/g;

    let tempPrice = $(sneakersInfo).find('div.fs16-md').text();
    let resultPrice = tempPrice.match(priceRegex);    //  100만원 하는 신발은 구별 못함
    let price = resultPrice[0] + resultPrice[1];
    let releaseInfo = $(sneakersInfo).find('p.draw-info').text();

    let drawTimeInfo = releaseInfo.match(timeRegex);
    let dateRegResult = dateRegex.exec(releaseInfo);
    let currentDate = new Date();
    let years = currentDate.getFullYear();  // 다음해로 넘어가는 12월에 문제 생길 가능성 있음
    let month = dateRegResult[1];
    let date = dateRegResult[2];

    let drawDateInfo = `${years}-${month}-${date}`;

    products[i] = {
      brand_name: drawList[i].brand_name,
      type_name: drawList[i].type_name,
      sneakers_name: drawList[i].sneakers_name,
      full_name: drawList[i].full_name,
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

async function insertNewProducts(newProducts) {
  console.log("데이터 베이스에 저장 중...");
  const INSERT_PRODUCT_SQL = "INSERT INTO draw_info SET ?";
  
  for (let i = 0; i < newProducts.length; i++) {
    DB.query(INSERT_PRODUCT_SQL, {
      brand_name: newProducts[i].brand_name,
      type_name: newProducts[i].type_name,
      sneakers_name: newProducts[i].sneakers_name,
      full_name: newProducts[i].full_name,
      product_price: newProducts[i].price,
      product_url: newProducts[i].url,
      draw_date: newProducts[i].draw_date,
      draw_start_time: newProducts[i].draw_start_time,
      draw_end_time: newProducts[i].draw_end_time,
      winner_announcement_time: newProducts[i].announcement_time,
      purchase_time: newProducts[i].purchase_time,
      img_url: newProducts[i].img_url
    }, (err, inserResult) => {
      if (err) {
        console.log(err);
      }
      else {
        console.log("새로운 Draw 저장 완료!!");
      }
    });
  }
}

async function getDrawList(brandName, brandUrl) {
  const HTML = await scrapPage(brandUrl);
  let $ = CHEERIO.load(HTML.data);
  let drawList = [];
  let bodyList = $("ul.gallery li");
  let strDraw = "THE DRAW 진행예정";  //응모중에는 'THE DRAW 응모하기 / 응모 끝나면 THE DRAW 응모 마감'

  bodyList.each(function (i, elem) {
    let releaseType = $(this).find('div.ncss-btn-primary-dark').text();

    // Check release type
    if (releaseType.indexOf(strDraw) != -1) {
      let productUrl = "https://www.nike.com";
      productUrl += $(this).find('a.comingsoon').attr('href');
      let product = {
        brand_name: brandName,
        type_name: $(this).find('h3.headline-5').text(),
        sneakers_name: $(this).find('h6.headline-3').text(),
        full_name: `${$(this).find('h3.headline-5').text()} ${$(this).find('h6.headline-3').text()}`,
        url: productUrl
      };

      drawList.push(product);
    }
  });

  return drawList;
}

function checkDrawDatas(brandName, drawList) {
  let newProducts = [];
  const DRAW_INFO_SQL = "SELECT full_name FROM draw_info WHERE brand_name=?";

  DB.query(DRAW_INFO_SQL, [brandName], async (err, drawDatas) => {
    if (err) {
      console.log(err);
    }
    else {
      for (let i = 0; i < drawList.length; i++) {
        if (drawDatas.indexOf(drawList[i].full_name) < 0) {
          newProducts.push(drawList[i]);
        }
      }

      if (newProducts.length) {
        insertNewProducts(await getSneakersInfo(newProducts));
        // 만약 시간이 09:00 ~ 21:00면 바로 알림
      }
      else {
        console.log("저장 할게 없어");
      }
    }
  });
}

function setAlarm(todayDrawProduct) {
  const DRAW_START_TIME = new Date(todayDrawProduct.draw_start_time);
  const SNEAKERS_NAME = `${todayDrawProduct.brand_name} ${todayDrawProduct.full_name}`;
  let drawStartAlarm = SCHEDULE.scheduleJob(DRAW_START_TIME, () => {
    console.log(`${SNEAKERS_NAME} THE DRAW 가 시작되었습니다!`);
    //  notification (Draw종료 시간, 몇분 동안 진행?, 당첨자 발표 시간 url)
    const DELETE_DRAW_SQL = "DELETE FROM draw_info WHERE id=?";

    DB.query(DELETE_DRAW_SQL, [todayDrawProduct.id], (err, complete) => {
      if (err) {
        console.log(err);
      }
      else {
        console.log("삭제 완료!!");
      }
    });
  });
  let startYear = DRAW_START_TIME.getFullYear();
  let startMonth = DRAW_START_TIME.getMonth() + 1;
  let startDate = DRAW_START_TIME.getDate();
  let startHours = DRAW_START_TIME.getHours() < 10 ? `0${DRAW_START_TIME.getHours()}` : DRAW_START_TIME.getHours();
  let startMinutes = DRAW_START_TIME.getMinutes() < 10 ? `0${DRAW_START_TIME.getMinutes()}` : DRAW_START_TIME.getMinutes();
  console.log(`${SNEAKERS_NAME}의 Drarw 알람이 ${startYear}-${startMonth}-${startDate} / ${startHours}:${startMinutes} 에 설정되었습니다.`);

  //  확인하지 않았으면 중간에 한번 더 알려주는거 
  const DRAW_END_TIME = new Date(todayDrawProduct.draw_end_time);
  let drawEndAlarm = SCHEDULE.scheduleJob(DRAW_END_TIME, () => {
    console.log(`${SNEAKERS_NAME}의 Draw가 종료되었습니다.`);
  });
}

let checkNewDrawsEveryMinutes = SCHEDULE.scheduleJob('40 * * * * *', async () => {
  let startTime = new Date();
  const Nike = new Draw("Nike", "https://www.nike.com/kr/launch/");
  let drawList = await getDrawList(Nike.brandName, Nike.url);
  const NUMBER_OF_DRAW_DATA_SQL = "SELECT COUNT(*) FROM draw_info WHERE brand_name=?";

  DB.query(NUMBER_OF_DRAW_DATA_SQL, ["Nike"], async (err, drawData) => {
    if (err) {
      console.log(err);
    }
    else if (drawList.length != drawData[0]['COUNT(*)']) {
      if (drawData[0]['COUNT(*)'] == 0) {
        insertNewProducts(await getSneakersInfo(drawList));
        // 만약 시간이 09:00 ~ 21:00면 바로 알림
      }
      else {
        checkDrawDatas(Nike.brandName, drawList);
      }
    }
    else {
      let endTime = new Date();
      let resultTime = (endTime - startTime) / 1000;
      console.log(`${resultTime}초 걸림!`);
      console.log("Nothing changed");
      console.log("---------------");
    }
  });
});

let checkNewDrawsEveryday = SCHEDULE.scheduleJob('0 10 0 * * *', async () => {
  const Nike = new Draw("Nike", "https://www.nike.com/kr/launch/");
  checkDrawDatas(Nike.brandName, await getDrawList(Nike.brandName, Nike.url));
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