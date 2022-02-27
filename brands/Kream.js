'use strict';
const AXIOS = require("axios");
const CHEERIO = require("cheerio");

class Kream {
    constructor(pageUrl)
    {
        this.url = pageUrl;
        this.sneakersList = [];
    }

    async scrapPage(url) {
        try {
          return await AXIOS.get(url);
        }
        catch (error) {
          console.error(`${error}: cannot get html!!!!!!!!!!!!!!!!`);
        }
    }

    async getSneakersPrice() {
        this.drawList = [];
        const html = await this.scrapPage(this.url);
        let $ = CHEERIO.load(html.data);
        let bodyList = $('div.search_result_item');
        // date

        for (let item of bodyList) {
            let date = $(item).find('div.sale').text();
            console.log(date);
        }
    }
}

module.exports = Kream;