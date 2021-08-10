'use strict';
const dotenv = require("dotenv");
const SCHEDULE = require("node-schedule");
const MYSQL = require("mysql");
const path = require("path");
const nodemailer = require("nodemailer");
const FS = require("fs");
const NikeDraw = require("./brands/NikeDraw");

dotenv.config({ path: './config/.env' });

const DB = MYSQL.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE
});

DB.connect((error) => {
  if (error) { // re logging
    console.log(error);
  }
});

function getEmailMessage(todayDrawProduct)
{
  let startTime = new Date(todayDrawProduct.draw_start_time);
  let endTime = new Date(todayDrawProduct.draw_end_time);
  let minutes = Math.floor((endTime - startTime) / 60000);
  let message = {
    title: `${todayDrawProduct.brand_name} ${todayDrawProduct.full_name} DRAW가 시작 되었습니다!`,
    contents: `
    <p><h2>${todayDrawProduct.brand_name} ${todayDrawProduct.full_name} DRAW가 시작 되었습니다!</h2></p>
    <p><span style="font-size:20px">${todayDrawProduct.draw_start_time} ~ ${todayDrawProduct.draw_end_time} </p>
    <p><span style="font-size:20px">${minutes}</span>분간 진행될 예정입니다. </p>
    <p>${todayDrawProduct.product_url}</p>`
  };

  return message;
}

async function sendMail(message) {
  let receiver = getMailReceiver();

  let transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASS
    }
  });

  let info = await transporter.sendMail({
    from: `"Ja Hwang" <${process.env.NODEMAILER_USER}>`,
    to: receiver,
    subject: message.title,
    html: message.contents
  });
}

function loggingNumberOfDrawProducts(numberProducts) {
  const logPath = './config/GetDrawInfoLog.txt';
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

function getMailReceiver()
{
  const receiverFilePath = "./config/receiver.txt";
  let data = FS.readFileSync(receiverFilePath).toString().split('\n');
  return data;
}

function insertNewProducts(newProducts) {
  console.log("데이터 베이스에 저장 중...");
  const INSERT_PRODUCT_SQL = "INSERT INTO draw_info SET ?";
  //  re type name too long
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
        console.log(err); // re exception
      }
      else {
        console.log("새로운 Draw 저장 완료!!");
      }
    });
  }
}

function checkDrawDatas(brand) {
  console.log("데이터 베이스 열어봄");
  let newDrawList = [];
  const DRAW_INFO_SQL = "SELECT full_name FROM draw_info WHERE brand_name=?";

  DB.query(DRAW_INFO_SQL, [brand.name], async (err, drawDatas) => {
    if (err) {
      console.log(err);
    }
    else {
      for (let sneakers of brand.drawList) {
        let isNewDraw = true;

        for (let data of drawDatas) {
          if (data.full_name == sneakers.full_name) {
            isNewDraw = false;
            break;
          }
        }

        if (isNewDraw) {
          newDrawList.push(sneakers);
        }
      }

      if (newDrawList.length > 0) {
        insertNewProducts(await brand.getSneakersInfo(newDrawList));
      }
      else {
        console.log("저장 할게 없어");
      }
    }
  });
}

// re server에서 해야 하는일
function setAlarm(todayDrawProduct) {
  const DRAW_START_TIME = new Date(todayDrawProduct.draw_start_time);
  const SNEAKERS_NAME = `${todayDrawProduct.brand_name} ${todayDrawProduct.full_name}`;
  const message = getEmailMessage(todayDrawProduct);

  let drawStartAlarm = SCHEDULE.scheduleJob(DRAW_START_TIME, () => {
    console.log(`${SNEAKERS_NAME} THE DRAW 가 시작되었습니다!`);
    //  notification (Draw종료 시간, 몇분 동안 진행?, 당첨자 발표 시간 url)
    sendMail(message).catch(console.error);
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

const Nike = new NikeDraw("Nike", "https://www.nike.com/kr/launch/");
let brands = [];
brands.push(Nike);

let checkNewDrawsEveryMinutes = SCHEDULE.scheduleJob('20 30 * * * *', async () => {
  let startTime = new Date();

  for (let brand of brands) {
    let drawList = await brand.getDrawList();
    loggingNumberOfDrawProducts(drawList.length);

    if (drawList.length == 0)
    {
      continue;
    }

    const NUMBER_OF_DRAW_DATA_SQL = "SELECT COUNT(*) FROM draw_info WHERE brand_name=?";
    DB.query(NUMBER_OF_DRAW_DATA_SQL, [brand.name], async (err, drawData) => {
      if (err) {
        console.log(err);
      }
      else if (drawList.length != drawData[0]['COUNT(*)']) {
        if (drawData[0]['COUNT(*)'] == 0) {
          insertNewProducts(await brand.getSneakersInfo(drawList));
          // 만약 시간이 09:00 ~ 21:00면 바로 알림
        }
        else {
          checkDrawDatas(brand);
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
  }
});

let checkNewDrawsEveryday = SCHEDULE.scheduleJob('0 10 0 * * *', async () => {
  for (let brand of brans) {
    await brand.getDrawList();
    checkDrawDatas(brand);
  }
});

// re server에서 해야 하는일
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
      let message = {
        title: "예정 없음",
        contents: "`${TODAY} THE DRAW 예정이 없습니다.`"
      };
      sendMail(message);
    }
    else {
      for (let data of todayDrawDatas) {
        setAlarm(data);
      }
    }
  });
});