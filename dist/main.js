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
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const child_process_1 = __importDefault(require("child_process"));
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const fluidsynth_1 = require("./fluidsynth");
const path_1 = __importDefault(require("path"));
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const body_parser_1 = __importDefault(require("body-parser"));
const socket_io_1 = require("socket.io");
const app = express_1.default();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server);
const chalk_1 = __importDefault(require("chalk"));
const ringlog_1 = require("./ringlog");
// import { uploadHandler } from "./upload";
const lcd_1 = require("./lcd");
const dial_1 = require("./dial");
const log = ringlog_1.Log(chalk_1.default.yellowBright);
app.use(express_fileupload_1.default({
    createParentPath: true,
}));
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static(path_1.default.join(__dirname, "..", "node_modules")));
app.use(express_1.default.static(path_1.default.join(__dirname, "..", "public")));
// Upload soundfont - have to figure out how to get this work on insecure domain
// app.post(
//   "/upload",
//   uploadHandler(log, () => (soundfonts = initialiseSoundFonts()))
// );
const lcd = (process.env.ENABLE_LCD || "false").toLowerCase() === "true"
    ? new lcd_1.LCD()
    : null;
log(`LCD ${lcd ? "enabled" : "disabled"}`);
const lcdPrint = (msg, line) => {
    if (lcd) {
        lcd.print((msg || "").padEnd(16, " "), line);
    }
};
lcdPrint("Starting...", 0);
const fluidsynth = new fluidsynth_1.FluidSynth(lcdPrint);
/**
 * Rotary Dial
 */
let shutdownMode = false;
const _ = (process.env.ENABLE_LCD || "false").toLowerCase() === "true"
    ? new dial_1.Dial({
        onDown: () => fluidsynth
            .loadPreviousFont()
            .then(() => lcdPrint(fluidsynth.currentSoundFont, 0)),
        onPress: () => {
            console.log("Press handler");
            if (shutdownMode) {
                return shutdown();
            }
            shutdownMode = true;
            const previousLCD = (lcd === null || lcd === void 0 ? void 0 : lcd.content) || [""];
            lcd === null || lcd === void 0 ? void 0 : lcd.print("Press to shutdown...", 0);
            setTimeout(() => {
                shutdownMode = false;
                lcd === null || lcd === void 0 ? void 0 : lcd.print(previousLCD === null || previousLCD === void 0 ? void 0 : previousLCD[0], 0);
            }, 3000);
        },
        onUp: () => fluidsynth
            .loadNextFont()
            .then(() => lcdPrint(fluidsynth.currentSoundFont, 0)),
    })
    : null;
server.listen(3000);
log("Webapp listening on port 3000");
io.on("connection", (client) => {
    client.emit("log", ringlog_1.ringlog.messages.join("\n"));
    const onLogMessage = (msg) => client.emit("log", msg);
    ringlog_1.ringlog.on("message", onLogMessage);
    client.on("disconnection", () => ringlog_1.ringlog.removeListener("message", onLogMessage));
    client.on("getinstruments", () => io.emit("instrumentdump", {
        fonts: fluidsynth.getFontList(),
        currentSoundfont: fluidsynth.currentSoundFont,
    }));
    client.on("changeinst", loadSoundFont);
    client.on("restart_fluidsynth", restartFluidsynth);
    client.on("shutdown", shutdown);
});
function loadSoundFont(index) {
    return __awaiter(this, void 0, void 0, function* () {
        fluidsynth.ready.then(() => {
            const font = fluidsynth.getFontList()[index];
            fluidsynth.loadFont(font);
        });
    });
}
function restartFluidsynth() {
    return __awaiter(this, void 0, void 0, function* () {
        fluidsynth.restart();
    });
}
function shutdown() {
    log("Shutting down computer...");
    lcdPrint("Shutdown...", 1);
    lcd === null || lcd === void 0 ? void 0 : lcd.lcd.backlight().off();
    child_process_1.default.execSync("shutdown -h now");
}
