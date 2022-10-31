"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Brand = void 0;
var Brand = /** @class */ (function () {
    function Brand(brand, url) {
        this.brandType = brand;
        this.url = url;
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
    return Brand;
}());
exports.Brand = Brand;
