'use strict';
const AXIOS = require("axios");
const CHEERIO = require("cheerio");
const https = require('https');

class WorksoutRaffle {
    constructor(brandName, pageUrl)
    {
        this.url = pageUrl;
        this.name = brandName;
        this.drawList = [];
        this.newProducts = [];
    }

    async scrapPage(url) {
        try {
            const options = {
                method: "get", 
                httpsAgent: new https.Agent({ 
                    rejectUnauthorized: false,
                })
            };
            return await AXIOS.get(url, options);
        }
        catch (error) {
            console.error(`${error}: cannot get html!!!!!!!!!!!!!!!!`);
        }
    }

    async getDrawList() {
        this.drawList = [];
        const html = await this.scrapPage(this.url);
        let $ = CHEERIO.load(html.data);
        // let bodyList = $('ul.prdList li');
        let bodyList = $('.prdList');
        let strDraw = 'RAFFLE CLOSED';
        console.log(html.data);
        for (let item of bodyList) {
            let releaseType = $(item).find('a.disabledBtn').text();

            // Check release type
            if (releaseType.indexOf(strDraw) < 0) {
                let product = {
                    brand_name: this.name,
                    type_name: $(item).find('span.name').text(),
                    sneakers_name: $(item).find('span.info').text(),
                    url: `https://www.worksout-raffle.co.kr/${$(item).find('a.disabledBtn').attr('href')}`
                };

                product.full_name = `${product.type_name} ${product.sneakers_name}`;
                this.drawList.push(product);
            }
        }

        return this.drawList;
    }
}

module.exports = WorksoutRaffle;