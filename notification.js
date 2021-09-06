const DB = require('./config/db.js');
const schedule = require('node-schedule');
const nodemailer = require('nodemailer');
const request = require('request');
const querystring = require('querystring');
const fs = require('fs');
const logging = require('./log.js');
const fetch = require('node-fetch');

async function testLoginKakao(token) {
    const options = {
        url:'https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=02dddf0ef129563c8e10a29f718f2f48&redirect_uri=http://localhost:3000/oauth',
        method: 'GET'
    };

    request(options, (error, response, body) => {
        if (error) {
            console.log(error);
            return
        }
        console.log(response);
    });

    // const tokenOptions = {
    //     url: 'https://kauth.kakao.com/oauth/token',
    //     method: 'POST',
    //     form: {
    //         grant_type : "authorization_code",
    //         client_id : "02dddf0ef129563c8e10a29f718f2f48",
    //         redirect_url : "https://localhost.com/oauth",
    //         code : "WfoRJ9M4SQO5QlsdxaATn10iC6MoqIcP4dOKdpTj2wDAk37xBpILQ9_4P7Gbv3v1lXBAkQo9dZoAAAF7tohm9A"
    //     }
    // };

    // request(tokenOptions, (error, response, body) => {
    //     if (error) {
    //         console.log(error);
    //         return
    //     }
    //     console.log(body);
    //     // console.log(response);
    //     // testSendKakaoMessage()
    // });
}

function testSendKakaoMessage(token) {
    const drawStartMessage = {
        object_type: "feed", 
        content: {
            title: "LD와플 x sacai x CLOT Orange Blaze 발매가 시작 되었습니다.", 
            image_url: "https://static-breeze.nike.co.kr/kr/launch/cmsstatic/product/DH1347-100/85b4b734-55aa-437a-9bc1-f9d049bfae0c_primary.jpg", 
            description: 'https://www.nike.com/kr/launch/t/men/fw/nike-sportswear/DH1347-100/lvbh14/nike-ldwaffle-s-c',
            link: {
                web_url: "https://www.nike.com/kr/launch"
            }
        }
    };

    const options = {
        url:'https://kapi.kakao.com/v2/api/talk/memo/default/send',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        form: {
            template_object: JSON.stringify(drawStartMessage)
        }
    };

    request(options, (error, response, body) => {
        if (error) {
            console.log(error);
            return
        }
        console.log(response.statusCode);
        console.log(body);
    });
}

async function test() {
    const api = 'https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=02dddf0ef129563c8e10a29f718f2f48&redirect_uri=http://localhost:3000/oauth';

    const testToken = await fetch(api);
    console.log(testToken.body);
}

test()

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

function setAlarm(todayDrawProduct) {
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
    const message = {
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
        console.log(`${SNEAKERS_NAME} THE DRAW 가 시작되었습니다!`);
        sendMail(message).catch(console.error);
        logging('notification', `${todayDrawProduct.full_name} THE DRAW 시작 알림`);
        //  notification (Draw종료 시간, 몇분 동안 진행?, 당첨자 발표 시간 url)
        const DELETE_DRAW_SQL = "DELETE FROM draw_info WHERE id=?";
  
        DB.query(DELETE_DRAW_SQL, [todayDrawProduct.id], (err, complete) => {
            if (err) {
                console.log(err);
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

let checkTodayDraw = schedule.scheduleJob('0 5 0 * * *', () => {
    const DAY = new Date();
    const TODAY = `${DAY.getFullYear()}-${DAY.getMonth() + 1}-${DAY.getDate()}`;
    const DRAW_INFO_SQL = "SELECT * FROM draw_info WHERE draw_date=?";
  
    DB.query(DRAW_INFO_SQL, [TODAY], (err, todayDrawDatas) => {
        if (err) {
            console.log(err);
        }
        else if (todayDrawDatas.length === 0) {
            console.log(`${TODAY} THE DRAW 예정이 없습니다.`);
            logging('notification', `${TODAY} THE DRAW 예정이 없습니다.`);
        }
        else {
            for (let drawData of todayDrawDatas) {
                setAlarm(drawData);
            }
        }
    });
});

module.exports = testLoginKakao;
