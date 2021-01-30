"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dial = void 0;
const johnny_five_1 = __importDefault(require("johnny-five"));
const board_1 = require("./board");
// Make this thing debounced.
// Detect direction, and emit every n seconds.
// When emit, cancel any pending direction detection
function rotaryEncoder({ aPin, bPin, pressButton, onUp, onDown, onPress, }) {
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
                console.log(current > value ? "up" : "down");
                emitTimer = undefined;
            }, 2000);
        }
        // console.log("data", value);
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
    // () => {
    // console.log("[BPin trigger]: ", aPin.value, bPin.value);
    // (aPin.value ? onDown() : onUp())
    // });
    aPin.on("change", handler);
    // () =>
    // console.log("[APin trigger]: ", aPin.value, bPin.value)
    // );
    pressButton.on("up", () => onPress());
}
class Dial {
    constructor({ onDown, onPress, onUp, }) {
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
