"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Nike_js_1 = require("./brands/Nike.js");
var nike = new Nike_js_1.Nike("Nike", "https://www.nike.com/kr/launch");
var products = nike.GetUpcommingProducts();
console.log(products.length);
for (var i = 0; i < products.length; ++i) {
    console.log("Brand name: ".concat(products[i].brandName));
    console.log("Type name: ".concat(products[i].typeName));
    console.log("Sneakers name: ".concat(products[i].sneakersName));
    console.log("Price: ".concat(products[i].price));
    console.log("url: ".concat(products[i].url));
    console.log("Start time: ".concat(products[i].startTime));
    console.log("End time: ".concat(products[i].endTime));
    console.log("Image url: ".concat(products[i].imgUrl));
}
