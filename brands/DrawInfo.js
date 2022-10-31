"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrawInfo = void 0;
var DrawInfo = /** @class */ (function () {
    function DrawInfo() {
    }
    DrawInfo.prototype.Equals = function (other) {
        return (this.brandType == other.brandType
            && this.url == other.url
            && this.imgUrl == other.imgUrl);
    };
    return DrawInfo;
}());
exports.DrawInfo = DrawInfo;
