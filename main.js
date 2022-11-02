"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Nike_js_1 = require("./brands/Nike.js");
var nike = new Nike_js_1.Nike("Nike", "https://www.nike.com/kr/launch");
var products = nike.GetUpcommingProducts();
// for (let i = 0;  i < products.length; ++i) {
//     console.log(`Brand name: ${products[i].brandName}`);
//     console.log(`Type name: ${products[i].typeName}`);
//     console.log(`Sneakers name: ${products[i].sneakersName}`);
//     console.log(`Price: ${products[i].price}`);
//     console.log(`url: ${products[i].url}`);
//     console.log(`Start time: ${products[i].startTime}`);
//     console.log(`End time: ${products[i].endTime}`);
//     console.log(`Image url: ${products[i].imgUrl}`);
// }
