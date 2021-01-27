"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startFluidSynth = void 0;
const child_process_1 = __importDefault(require("child_process"));
const chalk_1 = __importDefault(require("chalk"));
const os_1 = __importDefault(require("os"));
const ringlog_1 = require("./ringlog");
function startFluidSynth(fluidsynthArgs, aconnectArgs) {
    let ready = false;
    const log = ringlog_1.Log(chalk_1.default.green);
    const errorlog = ringlog_1.Log(chalk_1.default.redBright);
    return new Promise((resolve, reject) => {
        const fluidsynth = child_process_1.default.spawn("fluidsynth", fluidsynthArgs.split(" "));
        fluidsynth.stdout.on("data", (data) => {
            const message = data.toString();
            ready = ready || message.includes(">");
            log(data.toString());
        });
        fluidsynth.stderr.on("data", (error) => errorlog(error.toString()));
        const watcher = setInterval(() => {
            if (ready) {
                clearInterval(watcher);
                if (os_1.default.type() === "Linux") {
                    child_process_1.default.execSync(`aconnect ${aconnectArgs}`);
                }
                resolve(fluidsynth);
            }
        }, 1000);
    });
}
exports.startFluidSynth = startFluidSynth;
