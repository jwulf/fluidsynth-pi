"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LCD2 = void 0;
const sh1106_1 = require("sh1106");
class LCD2 {
    constructor() {
        this.content = [undefined, undefined];
        this.print = (message = "", lineNum = 0) => {
            this.device.canvas.clear();
            this.content[lineNum] = message;
            this.content.forEach((msg, i) => this.device.canvas.text(1, i * 30, msg !== null && msg !== void 0 ? msg : '', 1));
            // this.device.canvas.rectangle(1, 1, 120, 60, true)
            this.device.refresh();
            console.log("LCD:", message);
        };
        this.device = new sh1106_1.SH1106(128, 64);
    }
}
exports.LCD2 = LCD2;
