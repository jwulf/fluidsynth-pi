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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dial2 = void 0;
const fs_1 = __importDefault(require("fs"));
const child_process_1 = __importDefault(require("child_process"));
class Dial2 {
    constructor({ onDown, onPress, onUp, onHold, }) {
        const pins = [];
        const makeButton = (msg, pin, cb) => __awaiter(this, void 0, void 0, function* () {
            console.log(`Creating pin ${pin}`);
            const p = pin.toString();
            if (fs_1.default.existsSync(`/sys/class/gpio/gpio${p}`)) {
                child_process_1.default.execSync(`echo ${p} > /sys/class/gpio/unexport`);
            }
            // await delay(100)
            child_process_1.default.execSync(`echo ${p} > /sys/class/gpio/export`); // May need to be done manually
            // await delay(100)
            fs_1.default.writeFileSync(`/sys/class/gpio/gpio${p}/direction`, 'in');
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
                const state = fs_1.default.readFileSync(`/sys/class/gpio/gpio${pin.number}/value`, 'utf8');
                if (state[0] === '0') {
                    if (!pin.pressed) {
                        pin.pressed = true;
                        pin.cb();
                    }
                }
                else {
                    pin.pressed = false;
                }
            });
        }, 200);
        makeButton("up", 6, onHold);
        makeButton("down", 19, () => { });
        makeButton("left", 5, onDown);
        makeButton("right", 26, onUp);
        makeButton("press", 13, onPress);
        makeButton("key1", 21, onHold);
        makeButton("key2", 20, () => { });
        makeButton("key3", 16, () => { });
    }
}
exports.Dial2 = Dial2;
