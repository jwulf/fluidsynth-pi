"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.board = exports.Board = void 0;
const johnny_five_1 = __importDefault(require("johnny-five"));
const ringlog_1 = require("./ringlog");
let _board;
class Board {
    constructor() {
        const Raspi = require("raspi-io").RaspiIO;
        this.log = ringlog_1.Log();
        this.log("Starting j5...");
        this.board = new johnny_five_1.default.Board({ repl: false, io: new Raspi() });
        this.ready = new Promise((res) => this.board.on("ready", () => {
            this.log("Board ready...");
            res(this.board);
        }));
    }
}
exports.Board = Board;
const board = () => (_board ? _board : (_board = new Board()) || _board);
exports.board = board;
