'user strict'

const { stringify } = require("querystring");

class SneakersInfo {
    constructor(sneaker) {
        this.sneaker = sneaker;
        this.drawStartTime = new Date(sneaker.draw_start_time);
        this.drawEndTime = new Date(sneaker.draw_end_time);

        this.drawTime = {
            years: this.drawStartTime.getFullYear(),
            month: this.drawStartTime.getMonth() + 1,
            date: this.drawStartTime.getDate(),
            startHours: this.drawStartTime.getHours() < 10 ? `0${this.drawStartTime.getHours()}` : this.drawStartTime.getHours(),
            startMinutes: this.drawStartTime.getMinutes() < 10 ? `0${this.drawStartTime.getMinutes()}` : this.drawStartTime.getMinutes(),
            endHours: this.drawEndTime.getHours() < 10 ? `0${this.drawEndTime.getHours()}` : this.drawEndTime.getHours(),
            endMinutes: this.drawEndTime.getMinutes() < 10 ? `0${this.drawEndTime.getMinutes()}` : this.drawEndTime.getMinutes()
        };
    }
    
    getBrandName() {
        return this.sneaker.brand_name;
    }

    getFullName() {
        return this.sneaker.full_name;
    }

    getMonth() {
        return this.drawTime.month;
    }

    getDate() {
        return this.drawTime.date;
    }

    getStartHours() {
        return this.drawTime.startHours;
    }
    
    getStartMinutes() {
        return this.drawTime.startMinutes;
    }

    getEndHours() {
        return this.drawTime.endHours;
    }

    getEndMinutes() {
        return this.drawTime.endMinutes;
    }

    getTimeDifference() {
        return Math.floor((this.drawEndTime - this.drawStartTime) / 60000);
    }

    getImage() {
        return this.sneaker.img_url;
    }

    getUrl() {
        return this.sneaker.product_url;
    }

    getScheduledDrawMessage() {
        return `예정된 드로우: \n${this.sneaker.brand_name} ${this.sneaker.full_name}\n${this.drawTime.month}월 ${this.drawTime.date}일 ${this.drawTime.startHours}시 ${this.drawTime.startMinutes}분 ~ ${this.drawTime.endHours}시 ${this.drawTime.endMinutes}분 까지`;
    }

    getDrawStartMessage() {
        return `드로우 시작 알림: \n${this.sneaker.brand_name} ${this.sneaker.full_name}\n잠시후 ${this.drawTime.startHours}시 ${this.drawTime.startMinutes}분 ~ ${this.drawTime.endHours}시 ${this.drawTime.endMinutes}분 까지\n${this.getTimeDifference()}분간 진행 예정입니다.`;
    }
}

module.exports = SneakersInfo;