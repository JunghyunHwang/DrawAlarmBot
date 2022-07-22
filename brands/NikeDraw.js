'use strict';
const AXIOS = require("axios");
const CHEERIO = require("cheerio");

class NikeDraw {
    constructor(brandName, pageUrl)
    {
        this.url = pageUrl;
        this.name = brandName;
        this.drawList = [];
        this.newProducts = [];
    }

    async scrapPage(url) {
        try {
          return await AXIOS.get(url);
        }
        catch (error) {
          console.error(`${error}: cannot get html!!!!!!!!!!!!!!!!`);
        }
    }

    async getDrawList() {
        this.drawList = [];
        const html = await this.scrapPage(this.url);
        let $ = CHEERIO.load(html.data);
        let bodyList = $('ul.gallery li');
        let strDraw = 'THE DRAW 진행예정';  // 응모중에는 'THE DRAW 응모하기' / 응모 끝나면 'THE DRAW 응모 마감'
        
        for (let item of bodyList) {
            let releaseType = $(item).find('div.ncss-btn-primary-dark').text();

            // Check release type
            if (releaseType.indexOf(strDraw) >= 0) {
                let product = {
                    brand_name: this.name,
                    type_name: $(item).find('h3.headline-5').text(),
                    sneakers_name: $(item).find('h6.headline-3').text(),
                    url: `https://www.nike.com${$(item).find('a.comingsoon').attr('href')}`
                };

                product.full_name = `${product.type_name} ${product.sneakers_name}`;
                this.drawList.push(product);
            }
        }

        return this.drawList;
    }

    async getSneakersInfo(newDrawList) {
        this.drawList = [];
        
        for (let product of newDrawList) {
            let sneakers = await this.scrapPage(product.url);
            let $ = CHEERIO.load(sneakers.data);
            let imgInfo = $('div.prd-img-wrap');

            // 문자열 분할로 해결 해보자
            let priceRegex = /\d+/g;
            let timeRegex = /(\d{2}:\d{2})/g;
            let dateRegex = /(\d{1,2})\/(\d{1,2})/g;

            let tempPrice = $('div.fs16-md').text();
            let resultPrice = tempPrice.match(priceRegex);    //  100만원 넘는 신발은 구별 못함
            let price = resultPrice[0] + resultPrice[1];
            let releaseInfo = $('p.draw-info').text();
        
            let drawTimeInfo = releaseInfo.match(timeRegex);
            let dateRegResult = dateRegex.exec(releaseInfo);
            let month = Number(dateRegResult[1]);
            let date = Number(dateRegResult[2]);
            let current = new Date();
            let currentMonth = current.getMonth() + 1;
            let years = currentMonth === 12 && month === 1 ? current.getFullYear() + 1 : current.getFullYear();
            let drawDateInfo = `${years}-${month}-${date}`;

            let productInfo = {
                brand_name: product.brand_name,
                type_name: product.type_name,
                sneakers_name: product.sneakers_name,
                full_name: product.full_name,
                price: price,
                draw_date: drawDateInfo,
                draw_start_time: `${drawDateInfo} ${drawTimeInfo[0]}`,
                draw_end_time: `${drawDateInfo} ${drawTimeInfo[1]}`,
                announcement_time: `${drawDateInfo} ${drawTimeInfo[2]}`,
                purchase_time: `${drawDateInfo} ${drawTimeInfo[3]}`,
                url: product.url,
                img_url: $(imgInfo).find('img.image-component').attr('src')
            };
            
            this.newProducts.push(productInfo);
        }

        return this.newProducts;
    }
}

module.exports = NikeDraw;