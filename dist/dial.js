"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dial = void 0;
const johnny_five_1 = __importDefault(require("johnny-five"));
const board_1 = require("./board");
const delay = parseInt(process.env.ROTARY_DELAY || "500", 10);
let cycle = "DOWN";
function rotaryEncoder({ aPin, bPin, pressButton, onUp, onDown, onPress, onHold, }) {
    // https://gist.github.com/rwaldron/5db750527f257636c5d3b2c492737c99
    let value = 0;
    let rotation = 0;
    let last = 0;
    let lValue = 0;
    let emitTimer;
    const handler = function () {
        // this.emit("data", this.value);
        if (!emitTimer) {
            const current = value;
            emitTimer = setTimeout(() => {
                if (current != value) {
                    const isUp = current > value;
                    if (isUp) {
                        onUp();
                    }
                    else {
                        onDown();
                    }
                }
                emitTimer = undefined;
            }, delay);
        }
        var MSB = aPin.value;
        var LSB = bPin.value;
        var pos, turn;
        if (LSB === 1) {
            pos = MSB === 1 ? 0 : 1;
        }
        else {
            pos = MSB === 0 ? 2 : 3;
        }
        turn = pos - last;
        if (Math.abs(turn) !== 2) {
            if (turn === -1 || turn === 3) {
                value++;
            }
            else if (turn === 1 || turn === -3) {
                value--;
            }
        }
        last = pos;
        if (lValue !== value) {
            // this.emit("change", value);
            // console.log("change", value);
        }
        if (value % 80 === 0 && value / 80 !== rotation) {
            rotation = value / 80;
            console.log("rotation");
        }
        lValue = value;
    };
    bPin.on("change", handler);
    aPin.on("change", handler);
    pressButton.on("down", () => (cycle = "DOWN"));
    pressButton.on("press", () => (cycle = "PRESS"));
    pressButton.on("hold", () => (cycle = "HOLD"));
    pressButton.on("up", () => {
        // It cycles "DOWN" -> "PRESS" -> ["HOLD"] -> "UP"
        if (cycle === "PRESS") {
            onPress();
        }
        else {
            onHold();
        }
    });
}
class Dial {
    constructor({ onDown, onPress, onUp, onHold, }) {
        board_1.board().ready.then(() => {
            const aPin = new johnny_five_1.default.Pin({
                pin: "GPIO4",
                type: "digital",
                mode: 0,
            });
            const bPin = new johnny_five_1.default.Pin({
                pin: "GPIO5",
                type: "digital",
                mode: 0,
            });
            aPin.io.digitalWrite("GPIO4", aPin.io.HIGH);
            bPin.io.digitalWrite("GPIO5", bPin.io.HIGH);
            const pressButton = new johnny_five_1.default.Button({ pin: "GPIO6", isPullup: true });
            rotaryEncoder({
                aPin,
                bPin,
                pressButton,
                onUp: () => {
                    // console.log("up");
                    onUp();
                },
                onDown: () => {
                    // console.log("down");
                    onDown();
                },
                onPress: () => {
                    // console.log("press");
                    onPress();
                },
                onHold: () => {
                    // console.log("hold");
                    onHold();
                },
            });
        });
    }
}
exports.Dial = Dial;
