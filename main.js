"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Nike_js_1 = require("./brands/Nike.js");
var BrandManager_js_1 = require("./brands/BrandManager.js");
var brandManager = BrandManager_js_1.BrandManager.GetInstance();
var nike = new Nike_js_1.Nike("Nike", "https://www.nike.com/kr/launch");
brandManager.AddBrand(nike);
brandManager.LoadData().then(function () {
    main();
});
function main() {
    var nikeProducts = nike.GetUpcommingProducts();
    for (var i = 0; i < nikeProducts.length; ++i) {
        console.log("Brand name: ".concat(nikeProducts[i].brandName));
        console.log("Type name: ".concat(nikeProducts[i].typeName));
        console.log("Sneakers name: ".concat(nikeProducts[i].sneakersName));
        console.log("Price: ".concat(nikeProducts[i].price));
        console.log("URL: ".concat(nikeProducts[i].url));
        console.log("Start time: ".concat(nikeProducts[i].startTime));
        console.log("End time: ".concat(nikeProducts[i].endTime));
        console.log("Image url: ".concat(nikeProducts[i].imgUrl));
        console.log("------------------------------------------");
    }
}
