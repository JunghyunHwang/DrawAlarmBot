'use strict';
const SCHEDULE = require("node-schedule");
const AXIOS = require("axios");
const CHEERIO = require("cheerio");
const MYSQL = require("mysql");

class NikeDraw {
    constructor(brandName, pageUrl)
    {
        this.url = pageUrl;
        this.name = brandName;
        this.drawList = [];
        this.newProducts = [];
    }

    async scrapPage() {
        try {
          return await AXIOS.get(this.url);
        }
        catch (error) {
          console.error(`${error}: cannot get html!!!!!!!!!!!!!!!!`);
        }
    }

    async getDrawList() {
        const HTML = await this.scrapPage()
        let $ = CHEERIO.load(HTML.data);
        let bodyList = $("ul.gallery li");
        let strDraw = "THE DRAW 진행예정";  //응모중에는 'THE DRAW 응모하기 / 응모 끝나면 THE DRAW 응모 마감'
      
        bodyList.each(function (i, elem) {
            let releaseType = $(this).find('div.ncss-btn-primary-dark').text();
        
            // Check release type
            if (releaseType.indexOf(strDraw) != -1) {
                let productUrl = "https://www.nike.com";
                productUrl += $(this).find('a.comingsoon').attr('href');
                let product = {
                brand_name: this.name,
                type_name: $(this).find('h3.headline-5').text(),
                sneakers_name: $(this).find('h6.headline-3').text(),
                full_name: `${$(this).find('h3.headline-5').text()} ${$(this).find('h6.headline-3').text()}`,
                url: productUrl
                };
                th
                this.drawList.push(product);
            }
        });
    }

    async getSneakersInfo() { // 지금은 나이키 아니면 동작 안함
        console.log("가져오는 중...");
      
        for (let i = 0; i < this.drawList.length; i++) {
            let sneakers = await scrapPage(this.drawList[i].url);
            let $ = CHEERIO.load(sneakers.data);
            let sneakersInfo = $("aside.is-the-draw-start div");
            let imgInfo = $("div.prd-img-wrap");

            // 문자열 분할로 해결 해보자
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
        
            this.newProducts[i] = {
                brand_name: this.drawList[i].brand_name,
                type_name: this.drawList[i].type_name,
                sneakers_name: this.drawList[i].sneakers_name,
                full_name: this.drawList[i].full_name,
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
    }
}

module.exports = NikeDraw;