"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Brand = void 0;
var ProductInfo_1 = require("./ProductInfo");
var Database_1 = require("../config/Database");
var Brand = /** @class */ (function () {
    function Brand(name, url) {
        this.brandName = name;
        this.url = url;
        this.upcommingProducts = new Array();
    }
    Object.defineProperty(Brand.prototype, "GetUrl", {
        get: function () {
            return this.url;
        },
        enumerable: false,
        configurable: true
    });
    Brand.prototype.LoadProductInDatabase = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var DRAW_INFO_SQL = "SELECT brand_name, type_name, sneakers_name, product_price, product_url, draw_start_time, draw_end_time, img_url FROM draw_info WHERE brand_name=?";
            Database_1.db.query(DRAW_INFO_SQL, [_this.brandName], function (err, productDatas) {
                if (err) {
                    console.log("Error");
                    resolve(false);
                }
                for (var _i = 0, productDatas_1 = productDatas; _i < productDatas_1.length; _i++) {
                    var data = productDatas_1[_i];
                    var product = new ProductInfo_1.ProductInfo();
                    product.brandName = data.brand_name;
                    product.typeName = data.type_name;
                    product.sneakersName = data.sneakers_name;
                    product.price = data.product_price;
                    product.url = data.product_url;
                    product.startTime = data.draw_start_time;
                    product.endTime = data.draw_end_time;
                    product.imgUrl = data.img_url;
                    _this.upcommingProducts.push(product);
                }
                resolve(true);
            });
        });
    };
    Brand.prototype.GetUpcommingProducts = function () {
        return this.upcommingProducts;
    };
    return Brand;
}());
exports.Brand = Brand;
