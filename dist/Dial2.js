"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dial2 = void 0;
const rpio = require("rpio");
const { LOW } = rpio;
class Dial2 {
    constructor({ onDown, onPress, onUp, onHold, }) {
        const pins = [];
        const makeButton = ({ msg, pin, cb }) => __awaiter(this, void 0, void 0, function* () {
            console.log(`Creating pin ${pin}`);
            rpio.open(pin, rpio.INPUT, rpio.PULL_UP);
            // const p = pin.toString()
            // if (fs.existsSync(`/sys/class/gpio/gpio${p}`)) {
            //     cp.execSync(`echo ${p} > /sys/class/gpio/unexport`)
            // }
            // // await delay(100)
            // cp.execSync(`echo ${p} > /sys/class/gpio/export`) // May need to be done manually
            // // await delay(100)
            // fs.writeFileSync(`/sys/class/gpio/gpio${p}/direction`, 'in')
            pins.push({
                number: pin,
                cb: () => {
                    console.log(`Pushed ${msg}`);
                    cb();
                },
                pressed: false
            });
        });
        setInterval(() => {
            pins.forEach(pin => {
                const l = rpio.read(pin.number);
                // console.log(b, l)
                if (l !== LOW) {
                    pin.pressed = false;
                    return;
                }
                if (!pin.pressed) {
                    pin.pressed = true;
                    pin.cb();
                }
            });
        }, 200);
        makeButton({ msg: "up", pin: 6, cb: onHold });
        makeButton({ msg: "down", pin: 19, cb: () => { } });
        makeButton({ msg: "left", pin: 5, cb: onDown });
        makeButton({ msg: "right", pin: 26, cb: onUp });
        makeButton({ msg: "press", pin: 13, cb: onPress });
        makeButton({ msg: "key1", pin: 21, cb: onHold });
        makeButton({ msg: "key2", pin: 20, cb: () => { } });
        makeButton({ msg: "key3", pin: 16, cb: () => { } });
    }
}
exports.Dial2 = Dial2;
