"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dial = void 0;
const chalk_1 = __importDefault(require("chalk"));
const johnny_five_1 = __importDefault(require("johnny-five"));
const board_1 = require("./board");
const ringlog_1 = require("./ringlog");
const johnny_five_rotary_encoder_1 = __importDefault(require("johnny-five-rotary-encoder"));
class Dial {
    constructor() {
        this.log = ringlog_1.Log(chalk_1.default.greenBright);
        board_1.board().ready.then((board) => {
            this.upButton = new johnny_five_1.default.Button({
                pin: "GPIO4",
                isPullup: true,
                holdtime: 300,
            });
            this.downButton = new johnny_five_1.default.Button({
                pin: "GPIO5",
                isPullup: true,
                holdtime: 300,
            });
            this.pressButton = new johnny_five_1.default.Button({ pin: "GPIO6", isPullup: true });
            johnny_five_rotary_encoder_1.default({
                upButton: this.upButton,
                downButton: this.downButton,
                pressButton: this.pressButton,
                onUp: () => {
                    console.log("up");
                },
                onDown: () => {
                    console.log("down");
                },
                onPress: () => {
                    console.log("press");
                },
            });
        });
    }
}
exports.Dial = Dial;
