'use strict';
const SCHEDULE = require("node-schedule");
const AXIOS = require("axios");
const CHEERIO = require("cheerio");
const MYSQL = require("mysql");

class Draw {
    constructor(brandName, pageUrl)
    {
        this.url = pageUrl;
        this.brandName = brandName;
    }
}

module.exports = Draw;