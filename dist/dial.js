"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dial = void 0;
const johnny_five_1 = __importDefault(require("johnny-five"));
const board_1 = require("./board");
function rotaryEncoder({ aPin, bPin, pressButton, onUp, onDown, onPress, }) {
    bPin.on("change", () => {
        console.log("[BPin trigger]: ", aPin.value, bPin.value);
        // (aPin.value ? onDown() : onUp())
    });
    aPin.on("change", () => console.log("[APin trigger]: ", aPin.value, bPin.value));
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
