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
                case "FONTSCROLLER": {
                    this.fontScroller.onPress();
                    break;
                }
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
            switch (this.mode) {
                case "FONTS": {
                    this.showLoadingMessage();
                    this.fluidsynth
                        .loadPreviousFont()
                        .then(() => this.lcdPrint(this.fluidsynth.currentSoundFont, 0));
                    break;
                }
                case "SYSTEM": {
                    this.systemMenu.showPrevious();
                    break;
                }
                case "FONTSCROLLER": {
                    this.fontScroller.onDown();
                }
            }
        };
        this.onUp = () => {
            switch (this.mode) {
                case "FONTS": {
                    this.showLoadingMessage();
                    this.fluidsynth
                        .loadNextFont()
                        .then(() => this.lcdPrint(this.fluidsynth.currentSoundFont, 0));
                    break;
                }
                case "SYSTEM": {
                    this.systemMenu.showNext();
                    break;
                }
                case "FONTSCROLLER": {
                    this.fontScroller.onUp();
                    break;
                }
            }
        };
        this.setMode = (mode) => {
            log(`Menu: ${mode}`);
            this.mode = mode;
            switch (mode) {
                case "FONTS": {
                    this.lcdPrint("", 1);
                    this.lcdPrint(this.fluidsynth.currentSoundFont, 0);
                    break;
                }
                case "SYSTEM": {
                    this.systemMenu.show();
                    break;
                }
                case "UNSTARTED": {
                    this.lcdPrint("Connect keyboard", 0);
                    this.lcdPrint("& push dial...", 1);
                    break;
                }
                case "FONTSCROLLER": {
                    this.fontScroller.show();
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
        this.fontScroller = new FontScroller(fluidsynth, lcdPrint, (fontname) => {
            this.fluidsynth.loadFont(fontname);
            this.setMode("FONTS");
        });
    }
    showLoadingMessage() {
        log("Loading...");
        this.lcdPrint("Loading...", 1);
    }
}
exports.Menu = Menu;
var SystemMenuItem;
(function (SystemMenuItem) {
    SystemMenuItem[SystemMenuItem["SOUND"] = 0] = "SOUND";
    SystemMenuItem[SystemMenuItem["RESTART"] = 1] = "RESTART";
    SystemMenuItem[SystemMenuItem["UPDATE"] = 2] = "UPDATE";
    SystemMenuItem[SystemMenuItem["SHUTDOWN"] = 3] = "SHUTDOWN";
    SystemMenuItem[SystemMenuItem["EXIT"] = 4] = "EXIT";
})(SystemMenuItem || (SystemMenuItem = {}));
const SystemMenuItemLabels = [
    "Choose Sound",
    "Restart synth",
    "Update Code",
    "Shutdown",
    "Exit menu",
];
class SystemMenu {
    constructor(lcdPrint, fluidsynth) {
        this.lcdPrint = lcdPrint;
        this.fluidsynth = fluidsynth;
        this.index = SystemMenuItem.RESTART;
        this.shutdownMode = false;
        this.updating = false;
    }
    displayMenu() {
        const msg = SystemMenuItemLabels[this.index].padEnd(14, " ");
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
        if (this.index > SystemMenuItemLabels.length - 1) {
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
            this.index = SystemMenuItemLabels.length - 1;
        }
        this.displayMenu();
    }
    handlePress(setMode) {
        if (this.updating) {
            return;
        }
        switch (this.index) {
            case SystemMenuItem.SOUND: {
                setMode("FONTSCROLLER");
                break;
            }
            case SystemMenuItem.EXIT: {
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
                log("Updating git checkout...");
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
class FontScroller {
    constructor(fluidsynth, lcdPrint, callback) {
        this.fluidsynth = fluidsynth;
        this.lcdPrint = lcdPrint;
        this.callback = callback;
    }
    show() {
        this.fonts = this.fluidsynth.getFontList();
        this.index = this.fonts.indexOf(this.fluidsynth.currentSoundFont);
        this.lcdPrint("", 1);
        this.printFont();
    }
    onUp() {
        this.index++;
        this.index = this.index % this.fonts.length;
        this.printFont();
    }
    onDown() {
        this.index--;
        if (this.index < 0) {
            this.index = this.fonts.length - 1;
        }
        this.printFont();
    }
    onPress() {
        const currentFont = this.fonts[this.index];
        this.callback(currentFont);
    }
    printFont() {
        const msg = this.fonts[this.index].replace(".sf2", "").padEnd(14, " ");
        this.lcdPrint(`:arrowright: ${msg}`, 0);
    }
}
