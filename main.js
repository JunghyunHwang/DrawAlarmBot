"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Nike_js_1 = require("./brands/Nike.js");
var eBrandTypes_1 = require("./brands/eBrandTypes");
var n = new Nike_js_1.Nike(eBrandTypes_1.eBrand.NIKE, "https://www.nike.com/kr/launch");
n.getProductInfoInDatabase();
