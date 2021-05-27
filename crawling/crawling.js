const axios = require("axios");
const cheerio = require("cheerio");
const mysql = require("mysql");

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

exports.getInfo = (postUrl) => {
  let data = "";

  function getDrawInfo() {
    const drawInfoSql = "SELECT * FROM draw_info";

    db.query(drawInfoSql, (err, result) => {
      if (err) {
        console.log(err);
      }
      else if (result.length === 0) {
        data = 0;
      }
      else {
        data = result[0];
      }
    });
  }

  async function scrapPage(url) {
    try {
      return await axios.get(url);
    }
    catch (error) {
      console.error(`${error}: cannot get html`);
    }
  }

  async function getDrawList() {
    const html = await scrapPage(postUrl);
    let ulList = [];
    let drawList = [];
    let $ = cheerio.load(html.data);
    let bodyList = $("ul.gallery li");
    let strDraw = "THE DRAW 진행예정";
  
    bodyList.each(function(i, elem) {
      ulList[i] = {
        release_type: $(this).find('a.ncss-btn-primary-dark').text(),   //  Release type: Draw or Comming soon.
        url: $(this).find('a.comingsoon').attr('href')
      };
  
      // Check release type
      let hasDraw = ulList[i].release_type.indexOf(strDraw);
  
      if (hasDraw != -1) {
        let productUrl ="https://www.nike.com";
  
        productUrl += ulList[i].url;
        drawList.push({url: productUrl});
      }
    });

    return drawList
  }

  async function main() {
    let drawList = getDrawList();
    let drawData = "";
    const drawInfoSql = "SELECT * FROM draw_info";

    db.query(drawInfoSql, (err, result) => {
      if (err) {
        console.log(err);
      }
      else if (result.length === 0) {
        drawData = 0;
      }
      else {
        drawData = result[0];
      }
    });

    console.log(drawData);
  }

  main();
}