"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LCD2 = void 0;
const sh1106_1 = require("sh1106");
class LCD2 {
    constructor() {
        this.content = [undefined, undefined];
        this.device = new sh1106_1.SH1106(128, 64);
    }
    print(message = "", lineNum = 0) {
        this.device.canvas.text(1, lineNum, message, 1);
        this.content[lineNum] = message;
    }
}
exports.LCD2 = LCD2;
