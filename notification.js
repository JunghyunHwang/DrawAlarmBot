'use strict';
const db = require('./config/db.js');
const schedule = require('node-schedule');
const nodemailer = require('nodemailer');
const fs = require('fs');
const logging = require('./log.js');

async function sendMail(message) {
    const receiverFilePath = './config/receiver.txt';
    const receiver = fs.readFileSync(receiverFilePath).toString().split('\n');
  
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
  
    for (let member of receiver) {
        let info = await transporter.sendMail({
            from: `"Ja Hwang" <${process.env.NODEMAILER_USER}>`,
            to: member,
            subject: message.title,
            html: message.contents
        });
    }
}

function setDrawAlarm(todayDrawProduct) {
    const DRAW_START_TIME = new Date(todayDrawProduct.draw_start_time);
    const DRAW_END_TIME = new Date(todayDrawProduct.draw_end_time);
    const SNEAKERS_NAME = `${todayDrawProduct.brand_name} ${todayDrawProduct.full_name}`;
  
    // Formatting Draw date and time
    let years = DRAW_START_TIME.getFullYear();
    let month = DRAW_START_TIME.getMonth() + 1;
    let date = DRAW_START_TIME.getDate();
    let startHours = DRAW_START_TIME.getHours() < 10 ? `0${DRAW_START_TIME.getHours()}` : DRAW_START_TIME.getHours();
    let startMinutes = DRAW_START_TIME.getMinutes() < 10 ? `0${DRAW_START_TIME.getMinutes()}` : DRAW_START_TIME.getMinutes();
    let endHours = DRAW_END_TIME.getHours() < 10 ? `0${DRAW_END_TIME.getHours()}` : DRAW_END_TIME.getHours();
    let endMinutes = DRAW_END_TIME.getMinutes() < 10 ? `0${DRAW_END_TIME.getMinutes()}` : DRAW_END_TIME.getMinutes();
    let timeDifference = Math.floor((DRAW_END_TIME - DRAW_START_TIME) / 60000);
    const drawStartMessage = {
        title: `${SNEAKERS_NAME} DRAW가 시작 되었습니다!`,
        contents: `
        <div><h2>${SNEAKERS_NAME} DRAW가 시작 되었습니다!</h2></div>
        <div style="font-size:20px">${startHours}시 ${startMinutes}분 ~ ${endHours}시 ${endMinutes}분</div>
        <div><span style="font-size:25px">${timeDifference}</span>분간 진행될 예정입니다. </div>
        <div><a href="${todayDrawProduct.product_url}" style="font-size:25px">THE DRAW 응모 하기</a></div>
        <img src="${todayDrawProduct.img_url}"></img>
        `
    };
    logging('notification', `${years}-${month}-${date} ${startHours}:${startMinutes} ${todayDrawProduct.full_name} THE DRAW 알림 설정`);

    let drawStartAlarm = schedule.scheduleJob(DRAW_START_TIME, () => {
        sendMail(drawStartMessage);
        logging('notification', `${todayDrawProduct.full_name} THE DRAW 시작 알림`);
        //  notification (Draw종료 시간, 몇분 동안 진행?, 당첨자 발표 시간 url)
        const DELETE_DRAW_SQL = "DELETE FROM draw_info WHERE id=?";
  
        db.query(DELETE_DRAW_SQL, [todayDrawProduct.id], (err, complete) => {
            if (err) {
                logging('error', 'Fail DB query Remove data');
            }
            else {
                logging('info', `${todayDrawProduct.full_name} THE DRAW 삭제`);
            }
        });
    });
  
    //  확인하지 않았으면 중간에 한번 더 알려주는거
    let drawEndAlarm = schedule.scheduleJob(DRAW_END_TIME, () => {
        logging('notification', `${todayDrawProduct.full_name} THE DRAW 종료 알림`);
    });
}

let notificationTomorrowDraw = schedule.scheduleJob('0 0 21 * * *', () => {
    const DAY = new Date();
    const TODAY = `${DAY.getFullYear()}-${DAY.getMonth() + 1}-${DAY.getDate() + 1}`;
    const DRAW_INFO_SQL = "SELECT brand_name, full_name FROM draw_info WHERE draw_date=?";

    db.query(DRAW_INFO_SQL, [TODAY], (err, tomorrowDrawDatas) => {
        if (err) {
            logging('error', 'Fail DB query tomorrow draw');
        }
        else if (tomorrowDrawDatas.length > 0) {
            let tomorrowDrawCount = tomorrowDrawDatas.length;

            const tomorrowDrawMessage = { // brandname, 확인하기 url 변수 사용 필요
                title: `내일 Nike에서 ${tomorrowDrawCount}개의 DRAW가 예정 되어있습니다!`,
                contents: `
                <div><a href="https://www.nike.com/kr/launch/?type=upcoming" style="font-size:25px; color:black;">홈페이지에서 확인</a></div>
                `
            };
            sendMail(tomorrowDrawMessage);
        }
    });
});

let notificationTodayDraw = schedule.scheduleJob('0 0 7 * * *', () => {
    const DAY = new Date();
    const TODAY = `${DAY.getFullYear()}-${DAY.getMonth() + 1}-${DAY.getDate()}`;
    const DRAW_INFO_SQL = "SELECT * FROM draw_info WHERE draw_date=?";
  
    db.query(DRAW_INFO_SQL, [TODAY], (err, todayDrawDatas) => {
        if (err) {
            logging('error', 'Fail DB query set alarm');
        }
        else if (todayDrawDatas.length === 0) {
            logging('notification', `${TODAY} THE DRAW 예정이 없습니다.`);
        }
        else {
            for (let drawData of todayDrawDatas) {
                setDrawAlarm(drawData);
            }
        }
    });
});
