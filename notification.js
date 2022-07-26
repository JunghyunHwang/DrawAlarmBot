'use strict';
const db = require('./config/db.js');
const schedule = require('node-schedule');
const nodemailer = require('nodemailer');
const fs = require('fs');
const TelegramBot = require('./telegram');
const logging = require('./log.js');
const SneakersInfo = require('./draw/SneakersInfo.js');

const bot = TelegramBot.getInstance();

bot.on('message', (msg) => {
    const userInput = msg.text;
    const chatId = msg.chat.id;

    switch (userInput) {
        case '/start':
            const startMessage = `드로우 알림 봇 입니다.\nNike\n드로우 시간에 맞춰 알림을 보내드립니다.\n드로우 알림을 받으시려면 눌러 주세요.\n/follow 👈 😃`;
            bot.sendMessage(chatId, startMessage);
            break;
        case '/follow':
            const userInfoSql = 'SELECT chat_id FROM users WHERE chat_id=?';
            const insertChatId = "INSERT INTO users SET ?, created=NOW()";

            db.query(userInfoSql, [chatId], (err, userInfo) => {
                try {
                    if (userInfo.length > 0) {
                        bot.sendMessage(chatId, '이미 알림 설정 중 입니다. 🤔\n다른 기능들이 궁금하면 /info 를 입력 해주세요.');
                    } else {
                        db.query(insertChatId, {
                            chat_id: chatId, 
                            first_name: msg.chat.first_name,
                            last_name: msg.chat.last_name,
                        }, (err, inserResult) => {
                            try {
                                logging('info', `Add member ${msg.chat.last_name} ${msg.chat.first_name}`);
                                const thanksMessgae = '감사합니다! 알림 설정이 완료 되었습니다! 😁\n드로우 전날 21시와 드로우가 시작되는 시간에 알려드릴게요. \n다른 기능들이 궁금하면 /info 를 입력 해주세요.';
                                bot.sendMessage(chatId, thanksMessgae);
                            } catch (err) {
                                logging('error', 'Fail to add users');
                                const errorMessage = {
                                    title: 'Error: Add users',
                                    contents: 
                                    `<p>user 추가 실패</p>
                                    <p>${err}</p>`
                                };
                                sendErrorMail(errorMessage);
                                bot.sendMessage(chatId, '알림 설정 중 문제가 발생 했습니다. \n이 문제가 계속 된다면 dmagk560@gmail.com로 문의 해주세요.');
                            }
                        });
                    }
                } catch (err) {
                    logging('error', 'Fali to check user in database');
                    const errorMessage = {
                        title: 'Error: Check users',
                        contents: `users 확인 실패: ${err}`
                    };
                    sendErrorMail(errorMessage);
                    bot.sendMessage(chatId, '알림 설정 중 문제가 발생 했습니다. \n이 문제가 계속 된다면 dmagk560@gmail.com로 문의 해주세요.');
                }
            });
            break;
        case '/info':
            const infoMessage = '/follow -> 알림 설정\n\n/brands -> 드로우 알림이 가는 브랜드 목록\n\n/time -> 드로우 알림 시간\n\n/unfollow -> 팔로우 취소 😭\n\ndmagk560@gmail.com';
            bot.sendMessage(chatId, infoMessage);
            break;
        case '/schedule':
            const scheduleInfoSql = "SELECT brand_name, full_name, product_url, draw_date, draw_start_time, draw_end_time, img_url FROM draw_info";

            db.query(scheduleInfoSql, (err, drawInfo) => {
                console.log(typeof(drawInfo));
                console.log(typeof(drawInfo.length));
                
                try {
                    if (drawInfo.length === 0) {
                        bot.sendMessage(chatId, "예정된 드로우가 없습니다.🙂");
                    } else {
                        for (let sneaker of drawInfo) {
                            const sneakerInfo = new SneakersInfo(sneaker);

                            bot.sendPhoto(chatId, sneakerInfo.getImage(), {
                                    caption : sneakerInfo.getScheduledDrawMessage(),
                                    reply_markup: {
                                        inline_keyboard: [
                                            [
                                                { text: '확인하기', url: `${sneakerInfo.getUrl()}` }
                                            ]
                                        ]
                                    }
                                }
                            ).catch((err) => {
                                bot.sendMessage(chatId, sneakerInfo.getScheduledDrawMessage(), {
                                    reply_markup: {
                                        inline_keyboard: [
                                            [
                                                { text: '확인하기', url: `${sneakerInfo.getUrl()}` }
                                            ]
                                        ]
                                    }
                                });

                                logging('error', `Fail to Telegram send message ${err}`);
                            });
                        }
                    }
                } catch (err) {
                    console.log(err);
                    logging('error', `Fali to get draw information in database: ${err}`);
                    const errorMessage = {
                        title: 'Error: Get draw information',
                        contents: `Schedule 확인 실패: ${err}`
                    };
                    sendErrorMail(errorMessage);
                    bot.sendMessage(chatId, '문제가 발생 했습니다. \n이 문제가 계속 된다면 dmagk560@gmail.com로 문의 해주세요.');
                }
            });
            break;
        case '/brands':
            const listMessage = '- Nike \n\n더 추가될 예정입니다. 😅';
            bot.sendMessage(chatId, listMessage);
            break;
        case '/time':
            bot.sendMessage(chatId, '드로우 전날 21시와 드로우가 시작되는 시간에 알려 드립니다.\n알림이 가는 브랜드들이 궁금하다면 👉 /brands');
            break;
        case '/unfollow':
            const deleteUserInfoSql = 'DELETE FROM users WHERE chat_id=?';

            db.query(deleteUserInfoSql, [chatId], (err, userInfo) => {
                try {
                    bot.sendMessage(chatId, '알림 설정이 해제 되었습니다. 👋 \n알림 설정을 원하신다면 👉 /follow');
                } catch (err) {
                    logging('error', 'Fali to delete user in database');
                    const errorMessage = {
                        title: 'Error: Delete users',
                        contents: 'users 삭제 실패'
                    };
                    sendErrorMail(errorMessage);
                    bot.sendMessage(chatId, 'Unfollow 중 문제가 발생 했습니다.\n이 문제가 계속 발생하면 대화방을 삭제하시고\n삭제 및 정지를 눌러주세요.');
                }
            });
            break;
        default:
            const unKnownMessage = '알 수 없는 메시지 입니다.\n다른 기능들이 궁금하면 /info 를 입력 해주세요.';
            bot.sendMessage(chatId, unKnownMessage);
            break;
    }
});

async function sendNotificationMail(message) {
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

async function sendErrorMail(message) {
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
        to: "dmagk560@gmail.com",
        subject: message.title,
        html: message.contents
    });
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
        sendNotificationMail(drawStartMessage);
        logging('notification', `${todayDrawProduct.full_name} THE DRAW 시작 알림`);
        //  notification (Draw종료 시간, 몇분 동안 진행?, 당첨자 발표 시간 url)
        const DELETE_DRAW_SQL = "DELETE FROM draw_info WHERE id=?";
  
        db.query(DELETE_DRAW_SQL, [todayDrawProduct.id], (err, complete) => {
            if (err) {
                logging('error', 'Fail DB query Remove data');
                const errorMessage = {
                    title: `Error Draw_alarm`,
                    contents: `Fail DB query Remove data: ${err}`
                };
                sendErrorMail(errorMessage)
            } else {
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
    let day = new Date();
    day.setDate(day.getDate() + 1);
    const today = `${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()}`;
    const drawInfoSql = "SELECT brand_name, full_name, product_url, draw_start_time, draw_end_time, img_url FROM draw_info WHERE draw_date=?";

    db.query(drawInfoSql, [today], (err, tomorrowDrawDatas) => {
        if (err) {
            logging('error', 'Fail DB query tomorrow draw');
            const errorMessage = {
                title: `Error Draw_alarm`,
                contents: `Fail DB query tomorrow draw: ${err}`
            };
            sendErrorMail(errorMessage);
        } else if (tomorrowDrawDatas.length === 0) {
            logging('info', 'There is no draw tomorrow');
        } else if (tomorrowDrawDatas.length > 0) {
            // send mail
            const tomorrowDrawMessage = { // brandname, 확인하기 url 변수 사용 필요
                title: `내일 Nike에서 ${tomorrowDrawDatas.length}개의 DRAW가 예정 되어있습니다!`,
                contents: `
                <div><a href="https://www.nike.com/kr/launch/?type=upcoming" style="font-size:25px; color:black;">홈페이지에서 확인</a></div>
                `
            };
            sendNotificationMail(tomorrowDrawMessage);

            // send telegram
            const userInfoSql = 'SELECT chat_id FROM users';

            db.query(userInfoSql, (err, users) => {
                if (err) {
                    logging('error', 'Fali to check user in database');
                    const errorMessage = {
                        title: `Error: Get users info in tomorrow notification`,
                        contents: `
                        <p>users 가져오기 실패</p>
                        <p>${err}</p>
                        `
                    };
                    sendErrorMail(errorMessage);
                } else {
                    for (let i = 0; i < users.length; i++) {
                        const userChatId = users[i].chat_id;
                        
                        for (let j = 0; j < tomorrowDrawDatas.length; j++) {
                            const drawStartTime = new Date(tomorrowDrawDatas[j].draw_start_time);
                            const drawEndTime = new Date(tomorrowDrawDatas[j].draw_end_time);
                            const timeDifference = Math.floor((drawEndTime - drawStartTime) / 60000);

                            const startHours = drawStartTime.getHours() < 10 ? `0${drawStartTime.getHours()}` : drawStartTime.getHours();
                            const startMinutes = drawStartTime.getMinutes() < 10 ? `0${drawStartTime.getMinutes()}` : drawStartTime.getMinutes();
                            const endHours = drawEndTime.getHours() < 10 ? `0${drawEndTime.getHours()}` : drawEndTime.getHours();
                            const endMinutes = drawEndTime.getMinutes() < 10 ? `0${drawEndTime.getMinutes()}` : drawEndTime.getMinutes();

                            const drawMessage = `내일 드로우 알림: \n${tomorrowDrawDatas[j].brand_name} ${tomorrowDrawDatas[j].full_name}\n${startHours}시 ${startMinutes}분 ~ ${endHours}시 ${endMinutes}분 까지\n${timeDifference}분간 진행 예정입니다.`;

                            bot.sendPhoto(userChatId, tomorrowDrawDatas[j].img_url, {
                                    caption : drawMessage,
                                    reply_markup: {
                                        inline_keyboard: [
                                            [
                                                { text: '확인하기', url: `${tomorrowDrawDatas[j].product_url}` }
                                            ]
                                        ]
                                    }
                                }
                            ).catch((err) => {
                                bot.sendMessage(userChatId, drawMessage, {
                                    reply_markup: {
                                        inline_keyboard: [
                                            [
                                                { text: '확인하기', url: `${tomorrowDrawDatas[j].product_url}` }
                                            ]
                                        ]
                                    }
                                });
                                logging('error', `Fail to Telegram send message ${err}`);
                            });
                        }
                    }
                }
            });
        }
    });
});

function setTelegramMessage(todayDrawProduct)
{
    const drawStartTime = new Date(todayDrawProduct.draw_start_time);
    const drawEndTime = new Date(todayDrawProduct.draw_end_time);

    // Formatting Draw date and time
    const drawTime = {
        years: drawStartTime.getFullYear(),
        month: drawStartTime.getMonth() + 1,
        date: drawStartTime.getDate(),
        startHours: drawStartTime.getHours() < 10 ? `0${drawStartTime.getHours()}` : drawStartTime.getHours(),
        startMinutes: drawStartTime.getMinutes() < 10 ? `0${drawStartTime.getMinutes()}` : drawStartTime.getMinutes(),
        endHours: drawEndTime.getHours() < 10 ? `0${drawEndTime.getHours()}` : drawEndTime.getHours(),
        endMinutes: drawEndTime.getMinutes() < 10 ? `0${drawEndTime.getMinutes()}` : drawEndTime.getMinutes()
    };

    const timeDifference = Math.floor((drawEndTime - drawStartTime) / 60000);
    const drawStartMessage = `드로우 시작 알림: \n${todayDrawProduct.brand_name} ${todayDrawProduct.full_name}\n잠시 후 ${drawTime.startHours}시 ${drawTime.startMinutes}분 ~ ${drawTime.endHours}시 ${drawTime.endMinutes}분 까지\n${timeDifference}분간 진행 예정입니다.`;
    logging('notification', `${drawTime.years}-${drawTime.month}-${drawTime.date} ${drawTime.startHours}:${drawTime.startMinutes} ${todayDrawProduct.full_name} THE DRAW 알림 설정`);

    drawStartTime.setMinutes(drawStartTime.getMinutes() - 1);

    let drawStartAlarm = schedule.scheduleJob(drawStartTime, () => {
        const userInfoSql = 'SELECT chat_id FROM users';

        db.query(userInfoSql, (err, users) => {
            if (err) {
                logging('error', 'Fali to check user in database');
                const errorMessage = {
                    title: `Error: Get users info in tomorrow notification`,
                    contents: `
                    <p>users 가져오기 실패</p>
                    <p>${err}</p>
                    `
                };
                sendErrorMail(errorMessage);
            } else {
                for (let i = 0; i < users.length; i++) {
                    const userChatId = users[i].chat_id;
                    
                    bot.sendPhoto(userChatId, todayDrawProduct.img_url, {
                            caption : drawStartMessage,
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        { text: '지금 응모하기', url: `${todayDrawProduct.product_url}` }
                                    ]
                                ]
                            }
                        }
                    ).catch((err) => {
                        bot.sendMessage(userChatId, drawStartMessage, {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        { text: '지금 응모하기', url: `${todayDrawProduct.product_url}` }
                                    ]
                                ]
                            }
                        });
                        logging('error', `Fail to Telegram send message ${err}`);
                    });
                }
            }
        });
        
        logging('notification', `${todayDrawProduct.full_name} THE DRAW 시작 알림`);
        const delete_draw_sql = "DELETE FROM draw_info WHERE id=?";
  
        db.query(delete_draw_sql, [todayDrawProduct.id], (err, complete) => {
            if (err) {
                logging('error', 'Fail DB query Remove data');
                const errorMessage = {
                    title: `Error Draw_alarm`,
                    contents: `Fail DB query Remove data: ${err}`
                };
                sendErrorMail(errorMessage);
            } else {
                logging('info', `${todayDrawProduct.full_name} THE DRAW 삭제`);
            }
        });
    });
  
    //  확인하지 않았으면 중간에 한번 더 알려주는거
    let drawEndAlarm = schedule.scheduleJob(drawEndTime, () => {
        logging('notification', `${todayDrawProduct.full_name} THE DRAW 종료 알림`);
    });
}

let notificationTodayDraw = schedule.scheduleJob('0 0 7 * * *', () => {
    const day = new Date();
    const today = `${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()}`;
    const draw_info_sql = "SELECT * FROM draw_info WHERE draw_date=?";
  
    db.query(draw_info_sql, [today], (err, todayDrawDatas) => {
        if (err) {
            logging('error', 'Fail DB query set alarm');
            const errorMessage = {
                title: `Error Draw_alarm`,
                contents: `Fail DB query set alarm ${err}`
            };
            sendErrorMail(errorMessage);
        } else if (todayDrawDatas.length === 0) {
            logging('notification', `${today} THE DRAW 예정이 없습니다.`);
        } else {
            // Send mail
            for (let drawData of todayDrawDatas) {
                setDrawAlarm(drawData);
            }

            for (let drawData of todayDrawDatas) {
                setTelegramMessage(drawData);
            }
        }
    });
});
