"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductInfo = void 0;
var ProductInfo = /** @class */ (function () {
    function ProductInfo() {
    }
    ProductInfo.prototype.Equals = function (other) {
        return (this.brandName == other.brandName
            && this.url == other.url
            && this.imgUrl == other.imgUrl);
    };
    return ProductInfo;
}());
exports.ProductInfo = ProductInfo;
