const telegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const telegramToken = process.env.TELEGRAM_TOKEN;

class TelegramBot {
    constructor() {
        this.instance = null;
    }

    static getInstance() {
        if (this.instance === null) {
            this.instance = new telegramBot(telegramToken, { polling: true });
        }

        return this.instance;
    }
}

module.exports = TelegramBot;