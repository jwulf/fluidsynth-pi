"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Log = exports.ringlog = void 0;
const chalk_1 = __importDefault(require("chalk"));
const events_1 = require("events");
class RingLog extends events_1.EventEmitter {
    constructor(size = 200) {
        super();
        this.size = size;
        this.messages = [];
    }
    log(message) {
        this.messages.push(message);
        if (this.messages.length > this.size) {
            this.messages.splice(0, 1);
        }
        this.emit("message", message);
    }
    clear() {
        this.messages = [];
    }
}
exports.ringlog = new RingLog(40);
const Log = (color = chalk_1.default.yellowBright) => (msg) => {
    console.log(color(msg));
    exports.ringlog.log(msg);
};
exports.Log = Log;
