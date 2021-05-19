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

let nikeUpcomingUrl = "https://www.nike.com/kr/launch/?type=upcoming&activeDate=date-filter:AFTER_DATE";
let drawList = [];
let products = [];

async function getHtml(url) {
  try {
    return await axios.get(url);
  }
  catch (error) {
    console.error(`${error} Nope!!!!!!!!!!!!!!`);
  }
}

function formatReleaseInfo(releaseInfo) {
  let tempDate = new Date(); // 다음 해로 넘어가는 거면 문제 생김.... / 매달 바뀌는거라 아닐 수도?
  let drawStartTime = "";
  let announcementTime = "";
  let purchaseTime = "";
  // let timeReg = /(\d{2}:\d{2}) ~ (\d{2}:\d{2})/g;
  // let winnerTimeReg = /(\d{2}:\d{2})/g; //  하나로 통일 해봐
  // let purchaseTimeReg = /(\d{2}:\d{2}) ~ (\d{2}:\d{2})/g; // 한번 더 사용하니까 안됨 끝나는 시간까지
  let releaseDateReg = /(\d{1,2})\/(\d{1,2})/g;

  for (let i = 0; i < releaseInfo.length; i++) {
    let regResult;
    let info = releaseInfo[i].children[1].data;
    let treg = /(\d{2}:\d{2})|(\d{2}:\d{2}) ~ (\d{2}:\d{2})/g;

    switch(i) {
      case 0: //  Draw start time tag
        let regDateResult = releaseDateReg.exec(info);
        let month = regDateResult[1];
        let date = regDateResult[2];
        tempDate.setMonth(month - 1);
        tempDate.setDate(date);
        regResult = treg.exec(info);
        drawStartTime = regResult[1];
        break;
      case 1: //  Winner announcment time tag
        regResult = treg.exec(info);
        announcementTime = regResult[0];
        break;
      case 2: //  Purchase tag
        regResult = treg.exec(info);
        purchaseTime = regResult[1];
        break;
      default: // 예외 처리
        console.log("Unknown type...");
        break;
    }
  }

  let year = tempDate.getFullYear();
  let month = (tempDate.getMonth() + 1);
  let date = tempDate.getDate();
  let drawDate = `${year}-${month}-${date}`;

  return [drawDate, drawStartTime, announcementTime, purchaseTime];
}

async function getSneakersInfo() {
  console.log("가져오는 중...");

  for (let i = 0; i < drawList.length; i++) {
    let sneakers = await getHtml(drawList[i].url);
    let $ = cheerio.load(sneakers.data);
    let sneakersInfo = $("aside.is-the-draw-start div");
    let priceReg = /\d{2,3},\d{3}/g

    let type = $(sneakersInfo).find('h1.pb3-sm').text();
    let name = $(sneakersInfo).find('h5.pb3-sm').text();
    let tempPrice = $(sneakersInfo).find('div.fs16-md').text();
    let resultPrice = priceReg.exec(tempPrice);
    console.log(resultPrice);
    let price = resultPrice[0];
    let releaseInfo = $(sneakersInfo).find('p.draw-info');
    let drawInfo = formatReleaseInfo(releaseInfo);

    drawData = {
      type: type,
      name: name,
      price: price,
      draw_date: drawInfo[0],
      draw_time: drawInfo[1],
      announcement_time: drawInfo[2],
      purchase_time: drawInfo[3],
      url: drawList[i].url
    };

    products.push(drawData);
  }

  console.log(products);
}

async function getDrawInfo() {
  let html = await axios.get(nikeUpcomingUrl);
  let ulList = [];
  let $ = cheerio.load(html.data);
  let bodyList = $("ul.gallery li");
  let strDraw = "THE DRAW 진행예정";

  bodyList.each(function (i, elem) {
    ulList[i] = {
      release_type: $(this).find('a.ncss-btn-primary-dark').text(),
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

  getSneakersInfo();
}

getDrawInfo();

app.listen(3000, () => {
  console.log("Server is running like a Ninja");
});