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
            switch (this.mode) {
                case "FONTS": {
                    this.setMode("SYSTEM");
                    break;
                }
                case "SYSTEM": {
                    this.systemMenu.handlePress(this.setMode);
                    break;
                }
                case "UNSTARTED": {
                    this.lcdPrint("Restarting...", 0);
                    this.lcdPrint("", 1);
                    setTimeout(() => child_process_1.default.execSync("init 6"), 800);
                    // Need to get hotplugging to work
                    // This is not enough:
                    // modprobe -a snd_seq_midi snd_seq_midi_event snd_seq
                    // alsactl kill rescan
                    // this.fluidsynth
                    //   .restart()
                    //   .then(() => this.setFontMode())
                    //   .catch(() => {
                    //     this.lcdPrint("Failed to start", 0);
                    //     this.lcdPrint("", 1);
                    //     setTimeout(() => {
                    //       this.setMode("UNSTARTED");
                    //     }, 2000);
                    //   });
                    break;
                }
            }
        };
        this.onDown = () => {
            if (this.mode === "FONTS") {
                this.showLoadingMessage();
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
                this.showLoadingMessage();
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
        this.fluidsynth.on("fontLoaded", () => {
            log("Loaded");
            if (this.mode === "FONTS") {
                lcdPrint("", 1);
            }
        });
    }
    showLoadingMessage() {
        log("Loading...");
        this.lcdPrint("Loading...", 1);
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
var SystemMenuItem;
(function (SystemMenuItem) {
    SystemMenuItem[SystemMenuItem["RESTART"] = 0] = "RESTART";
    SystemMenuItem[SystemMenuItem["UPDATE"] = 1] = "UPDATE";
    SystemMenuItem[SystemMenuItem["SHUTDOWN"] = 2] = "SHUTDOWN";
    SystemMenuItem[SystemMenuItem["FONTS"] = 3] = "FONTS";
})(SystemMenuItem || (SystemMenuItem = {}));
class SystemMenu {
    constructor(lcdPrint, fluidsynth) {
        this.lcdPrint = lcdPrint;
        this.fluidsynth = fluidsynth;
        this.index = SystemMenuItem.RESTART;
        this.options = ["Restart synth", "Update Code", "Shutdown", "Exit menu"];
        this.shutdownMode = false;
        this.updating = false;
    }
    displayMenu() {
        const msg = this.options[this.index].padEnd(14, " ");
        this.lcdPrint(`:arrowright: ${msg}`, 0);
        this.lcdPrint("", 1);
    }
    show() {
        this.index = 0;
        this.lcdPrint("", 1);
        this.displayMenu();
    }
    showNext() {
        if (this.shutdownMode || this.updating) {
            return;
        }
        this.index++;
        if (this.index > this.options.length - 1) {
            this.index = 0;
        }
        this.displayMenu();
    }
    showPrevious() {
        if (this.shutdownMode || this.updating) {
            return;
        }
        this.index--;
        if (this.index < 0) {
            this.index = this.options.length - 1;
        }
        this.displayMenu();
    }
    handlePress(setMode) {
        if (this.updating) {
            return;
        }
        switch (this.index) {
            case SystemMenuItem.FONTS: {
                setMode("FONTS");
                break;
            }
            case SystemMenuItem.RESTART: {
                this.fluidsynth.restart().then(() => setMode("FONTS"));
                break;
            }
            case SystemMenuItem.SHUTDOWN: {
                if (this.shutdownMode) {
                    this.doShutdown();
                }
                else {
                    this.lcdPrint("Confirm shutdown?", 1);
                    this.shutdownMode = true;
                    setTimeout(() => {
                        this.shutdownMode = false;
                        this.lcdPrint("", 1);
                        this.displayMenu();
                    }, 3000);
                }
                break;
            }
            case SystemMenuItem.UPDATE: {
                this.updating = true;
                this.lcdPrint("Updating...", 1);
                setTimeout(() => {
                    try {
                        log(child_process_1.default.execSync("git reset --hard").toString());
                        log(child_process_1.default.execSync("git pull").toString());
                        this.lcdPrint("Success", 1);
                        log("Update succeeded");
                    }
                    catch (e) {
                        this.lcdPrint("Error", 1);
                        log("Update failed");
                    }
                    this.updating = false;
                }, 800);
                break;
            }
            default:
                const exhaustiveCheck = this.index;
                throw new Error(`Unhandled case: ${exhaustiveCheck}`);
        }
    }
    doShutdown() {
        log("Shutting down computer...");
        this.lcdPrint("", 0);
        this.lcdPrint("Shutdown.", 1);
        setTimeout(() => child_process_1.default.execSync("shutdown -h now"), 800);
    }
}
