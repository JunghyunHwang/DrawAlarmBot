'use strict';
const db = require('./config/db.js');
const logging = require('./log.js');
const telegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const telegramToken = process.env.TELEGRAM_TOKEN;
const bot = new telegramBot(telegramToken, {polling: true});

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
                    }
                    else {
                        db.query(insertChatId, {
                            chat_id: chatId, 
                            first_name: msg.chat.first_name,
                            last_name: msg.chat.last_name,
                        }, (err, inserResult) => {
                            try {
                                logging('info', `Add member ${msg.chat.last_name} ${msg.chat.first_name}`);
                                const thanksMessgae = '감사합니다! 알림 설정이 완료 되었습니다! 😁\n드로우 전날 21시와 드로우가 시작되는 시간에 알려드릴게요. \n다른 기능들이 궁금하면 /info 를 입력 해주세요.';
                                bot.sendMessage(chatId, thanksMessgae);
                            }
                            catch (err) {
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
                }
                catch (err) {
                    logging('error', 'Fali to check user in database');
                    const errorMessage = {
                        title: 'Error: Check users',
                        contents: 'users 확인 실패'
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
        case '/shedule':
            // 예정되 있는 드로우 정보 전달
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
                }
                catch (err) {
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