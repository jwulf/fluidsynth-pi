"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const fluidsynth_1 = require("./fluidsynth");
const chalk_1 = __importDefault(require("chalk"));
const ringlog_1 = require("./ringlog");
const lcd_1 = require("./lcd");
const dial_1 = require("./dial");
const Menu_1 = require("./Menu");
const web_ui_1 = require("./web-ui");
const log = ringlog_1.Log(chalk_1.default.yellowBright);
const lcdEnabled = (process.env.ENABLE_LCD || "false").toLowerCase() === "true";
const lcd = lcdEnabled ? new lcd_1.LCD() : null;
log(`LCD ${lcdEnabled ? "enabled" : "disabled"}`);
const lcdPrint = (msg, line) => {
    if (lcd) {
        return lcd.print((msg || "").replace(".sf2", "").padEnd(16, " "), line);
    }
};
lcdPrint("Starting...", 0);
process.on("exit", (code) => {
    lcdPrint("Stopped...", 0);
    lcdPrint("", 1);
});
const fluidsynth = new fluidsynth_1.FluidSynth(lcdPrint, () => menu === null || menu === void 0 ? void 0 : menu.setMode("FONTS"), () => menu === null || menu === void 0 ? void 0 : menu.setMode("UNSTARTED"));
const menu = new Menu_1.Menu(fluidsynth, lcdPrint);
/**
 * Rotary Dial
 */
const __dial = lcdEnabled
    ? new dial_1.Dial({
        onDown: () => menu.onDown(),
        onPress: () => menu.onPress(),
        onUp: () => menu.onUp(),
    })
    : null;
const webUIEnabled = (process.env.WEBUI_ENABLED || "true").toLowerCase() !== "false";
log(`Web UI: ${webUIEnabled ? "enabled" : "disabled"}`);
if (webUIEnabled) {
    web_ui_1.startWebInterface(fluidsynth, menu);
}
