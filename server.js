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
let products = [];

async function getHtml(url) {
  try {
    return await axios.get(url);
  }
  catch (error) {
    console.error(`${error} Nope!!!!!!!!!!!!!!`);
  }
}

function formatReleaseInfo(releaseDayInfo) {
  let tempDate = new Date(); // 다음 해로 넘어가는 거면 문제 생김.... / 매달 바뀌는거라 아닐 수도?
  let drawStartTime = "";
  let announcementTime = "";
  let purchaseTime = "";
  let releaseDateReg = /(\d{1,2})\/(\d{1,2})/g;

  for (let i = 0; i < releaseDayInfo.length; i++) {
    let info = releaseDayInfo[i].children[1].data;
    let timeReg = /(\d{2}:\d{2})/g;
    let regResult = info.match(timeReg);

    switch(i) {
      case 0: //  Draw start time tag
        let regDateResult = releaseDateReg.exec(info);
        let month = regDateResult[1];
        let date = regDateResult[2];
        tempDate.setMonth(month - 1);
        tempDate.setDate(date);
        drawStartTime = regResult[0];
        // end time here = regResult[1];
        break;
      case 1: //  Winner announcment time tag
        announcementTime = regResult[0];
        break;
      case 2: //  Purchase tag
        purchaseTime = regResult[0];
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

async function getSneakersInfo(drawList) {
  console.log("가져오는 중...");

  for (let i = 0; i < drawList.length; i++) {
    let sneakers = await getHtml(drawList[i].url);
    let $ = cheerio.load(sneakers.data);
    let sneakersInfo = $("aside.is-the-draw-start div");
    let imgInfo = $("div.prd-img-wrap");
    let priceReg = /\d+/g;

    let type = $(sneakersInfo).find('h1.pb3-sm').text();
    let name = $(sneakersInfo).find('h5.pb3-sm').text();
    let tempPrice = $(sneakersInfo).find('div.fs16-md').text();
    let resultPrice = tempPrice.match(priceReg);
    let price = resultPrice[0] + resultPrice[1];
    let releaseDayInfo = $(sneakersInfo).find('p.draw-info');
    let drawInfo = formatReleaseInfo(releaseDayInfo);

    let img_url = $(imgInfo).find('figure.snkrs-gallery-item').attr('href');
    console.log(img_url);

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
  let drawList = [];
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

  getSneakersInfo(drawList);
}

getDrawInfo();

app.listen(3000, () => {
  console.log("Server is running like a Ninja");
});