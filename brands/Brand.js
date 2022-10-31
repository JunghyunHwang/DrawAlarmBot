"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Brand = void 0;
var eBrandTypes_1 = require("./eBrandTypes");
var Database_1 = require("../config/Database");
var Brand = /** @class */ (function () {
    function Brand(brand, url) {
        this.brandType = brand;
        this.url = url;
        switch (this.brandType) {
            case eBrandTypes_1.eBrand.NIKE:
                this.brandName = "Nike";
                break;
            default:
                break;
        }
    }
    Object.defineProperty(Brand.prototype, "GetBrandType", {
        get: function () {
            return this.brandType;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Brand.prototype, "GetUrl", {
        get: function () {
            return this.url;
        },
        enumerable: false,
        configurable: true
    });
    Brand.prototype.getProductInfoInDatabase = function () {
        var result;
        var DRAW_INFO_SQL = "SELECT full_name FROM draw_info WHERE brand_name=?";
        Database_1.db.query(DRAW_INFO_SQL, [this.brandName], function (err, productDatas) {
            console.log(typeof (productDatas));
            console.log(productDatas);
        });
        return result;
    };
    return Brand;
}());
exports.Brand = Brand;
