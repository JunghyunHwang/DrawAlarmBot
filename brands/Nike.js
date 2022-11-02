"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Nike = void 0;
var Brand_1 = require("./Brand");
var Nike = /** @class */ (function (_super) {
    __extends(Nike, _super);
    function Nike(name, url) {
        return _super.call(this, name, url) || this;
    }
    Nike.prototype.GetNewProduct = function (products) {
        var product = [];
        // ...
        return product;
    };
    return Nike;
}(Brand_1.Brand));
exports.Nike = Nike;
