"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Menu = void 0;
const child_process_1 = __importDefault(require("child_process"));
const ringlog_1 = require("./ringlog");
const chalk_1 = __importDefault(require("chalk"));
const log = ringlog_1.Log(chalk_1.default.yellowBright);
class Menu {
    constructor(fluidsynth, lcdPrint) {
        this.fluidsynth = fluidsynth;
        this.lcdPrint = lcdPrint;
        this.mode = "UNSTARTED";
        this.onPress = () => {
            if (this.mode === "FONTS") {
                this.setSystemMode();
            }
            if (this.mode === "SYSTEM") {
                this.systemMenu.handlePress(this.setMode);
            }
            if (this.mode === "UNSTARTED") {
                this.fluidsynth
                    .restart()
                    .then(() => this.setFontMode())
                    .catch(() => {
                    this.lcdPrint("Failed to start", 0);
                    this.lcdPrint("", 1);
                    setTimeout(() => {
                        this.setMode("UNSTARTED");
                    }, 2000);
                });
            }
        };
        this.onDown = () => {
            if (this.mode === "FONTS") {
                this.fluidsynth
                    .loadPreviousFont()
                    .then(() => this.lcdPrint(this.fluidsynth.currentSoundFont, 0));
            }
            if (this.mode === "SYSTEM") {
                this.systemMenu.showPrevious();
            }
        };
        this.onUp = () => {
            if (this.mode === "FONTS") {
                this.fluidsynth
                    .loadNextFont()
                    .then(() => this.lcdPrint(this.fluidsynth.currentSoundFont, 0));
            }
            if (this.mode === "SYSTEM") {
                this.systemMenu.showNext();
            }
        };
        this.setMode = (mode) => {
            log(`Menu: ${mode}`);
            switch (mode) {
                case "FONTS": {
                    this.setFontMode();
                    break;
                }
                case "SYSTEM": {
                    this.setSystemMode();
                    break;
                }
                case "UNSTARTED": {
                    this.lcdPrint("Connect keyboard", 0);
                    this.lcdPrint("& push dial...", 1);
                    break;
                }
            }
        };
        this.systemMenu = new SystemMenu(this.lcdPrint, fluidsynth);
    }
    setFontMode() {
        this.mode = "FONTS";
        this.lcdPrint("", 1);
        this.lcdPrint(this.fluidsynth.currentSoundFont, 0);
    }
    setSystemMode() {
        this.mode = "SYSTEM";
        this.systemMenu.show();
    }
}
exports.Menu = Menu;
class SystemMenu {
    constructor(lcdPrint, fluidsynth) {
        this.lcdPrint = lcdPrint;
        this.fluidsynth = fluidsynth;
        this.index = 0;
        this.options = ["Restart synth", "Shutdown", "Fonts"];
        this.shutdownMode = false;
    }
    print() {
        this.lcdPrint(this.options[this.index], 0);
    }
    show() {
        this.index = 0;
        this.lcdPrint("", 1);
        this.print();
    }
    showNext() {
        this.index++;
        if (this.index > this.options.length - 1) {
            this.index = 0;
        }
        this.print();
    }
    showPrevious() {
        this.index--;
        if (this.index < 0) {
            this.index = this.options.length - 1;
        }
        this.print();
    }
    handlePress(setMode) {
        switch (this.index) {
            case SystemMenu.FONTS: {
                setMode("FONTS");
                break;
            }
            case SystemMenu.RESTART: {
                this.fluidsynth.restart();
                break;
            }
            case SystemMenu.SHUTDOWN: {
                if (this.shutdownMode) {
                    this.doShutdown();
                }
                else {
                    this.lcdPrint("Press to shutdown", 0);
                    this.shutdownMode = true;
                    setTimeout(() => {
                        this.shutdownMode = false;
                        this.print();
                    }, 3000);
                }
                break;
            }
        }
    }
    doShutdown() {
        log("Shutting down computer...");
        this.lcdPrint("Shutdown...", 1);
        child_process_1.default.execSync("shutdown -h now");
    }
}
SystemMenu.RESTART = 0;
SystemMenu.SHUTDOWN = 1;
SystemMenu.FONTS = 2;
