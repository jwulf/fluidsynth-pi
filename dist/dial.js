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
class Dial {
    constructor() {
        this.log = ringlog_1.Log(chalk_1.default.greenBright);
        board_1.board().ready.then((board) => {
            this.upButton = new johnny_five_1.default.Button({
                pin: "GPIO4",
                isPullup: true,
            });
            this.downButton = new johnny_five_1.default.Button({
                pin: "GPIO5",
                isPullup: true,
            });
            this.pressButton = new johnny_five_1.default.Button({ pin: "GPIO6", isPullup: true });
            rotaryEncoder({
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
function rotaryEncoder({ upButton, downButton, pressButton, onUp, onDown, onPress, }) {
    let waveform = "";
    let waveformTimeout;
    upButton.on("up", () => {
        waveform += "1";
        handleWaveform();
    });
    downButton.on("up", () => {
        waveform += "0";
        handleWaveform();
    });
    pressButton.on("up", () => {
        onPress();
    });
    function handleWaveform() {
        if (waveform.length < 2) {
            waveformTimeout = setTimeout(() => {
                waveform = "";
            }, 8);
            return;
        }
        if (waveformTimeout) {
            clearTimeout(waveformTimeout);
        }
        if (waveform === "01") {
            onUp();
        }
        else if (waveform === "10") {
            onDown();
        }
        waveform = "";
    }
}
