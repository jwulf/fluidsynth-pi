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
exports.FluidSynth = void 0;
const child_process_1 = __importDefault(require("child_process"));
const chalk_1 = __importDefault(require("chalk"));
const os_1 = __importDefault(require("os"));
const ringlog_1 = require("./ringlog");
const SoundFontLibrary_1 = require("./SoundFontLibrary");
const events_1 = require("events");
class FluidSynth extends events_1.EventEmitter {
    constructor(lcdPrint) {
        super();
        this.lcdPrint = lcdPrint;
        this.log = ringlog_1.Log(chalk_1.default.green);
        this.loadedFontCount = 0;
        const defaultFluidsynthArgs = "--sample-rate 48000 --gain 3 -o synth.polyphony=16" + os_1.default.type() ===
            "Linux"
            ? " --audio-driver=alsa"
            : "";
        const argsFromEnv = process.env.FLUIDSYNTH_ARGS;
        this.fluidsynthArgs = argsFromEnv || defaultFluidsynthArgs;
        this.aconnectArgs = process.env.ACONNECT_ARGS || "16:0 128:0";
        this.log(`FluidSynth args: ${this.fluidsynthArgs}`);
        lcdPrint("Starting...", 0);
        this.errorlog = ringlog_1.Log(chalk_1.default.redBright);
        this.soundFontLibrary = new SoundFontLibrary_1.SoundFontLibrary();
        this.ready = this.start();
        this.ready.then(() => {
            this._loadFont(this.soundFontLibrary.currentSoundfont);
        });
    }
    start() {
        return new Promise((resolve, reject) => {
            let blockForReady = true;
            this.process = child_process_1.default.spawn("fluidsynth", this.fluidsynthArgs.split(" "));
            this.process.stderr.on("data", (error) => this.errorlog(error.toString()));
            this.process.stdout.on("data", (data) => {
                const message = data.toString();
                if (message.includes("loaded SoundFont has ID")) {
                    this.emit("fontLoaded");
                }
                if (message.includes("load soundfonts/")) {
                    this.emit("fontLoading");
                }
                if (blockForReady && message.includes(">")) {
                    blockForReady = false;
                    if (os_1.default.type() === "Linux") {
                        try {
                            child_process_1.default.execSync(`aconnect ${this.aconnectArgs}`);
                        }
                        catch (e) {
                            return reject(e);
                        }
                    }
                    return resolve(process);
                }
                this.log(data.toString() + " >>");
            });
        });
    }
    getFontList() {
        return this.soundFontLibrary.soundFonts;
    }
    loadNextFont() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._loadFont(this.soundFontLibrary.scrollToNextSoundFont());
        });
    }
    loadPreviousFont() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._loadFont(this.soundFontLibrary.scrollToPreviousSoundFont());
        });
    }
    loadFont(fontname) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.soundFontLibrary.soundFonts.includes(fontname)) {
                this._loadFont(fontname);
                this.soundFontLibrary.currentSoundfont = fontname;
                this.soundFontLibrary.currentSoundfontIndex = this.soundFontLibrary.soundFonts.indexOf(fontname);
            }
            else {
                this.log("Soundfont not found!");
            }
        });
    }
    _loadFont(fontname) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.loadedFontCount === 22) {
                yield this.restart();
                this.loadedFontCount = 0;
            }
            this.log(`Changing to ${fontname}...`);
            if (this.loadedFontCount !== 0) {
                this.process.stdin.write(`unload ${this.loadedFontCount}\n`);
            }
            this.loadedFontCount++;
            this.process.stdin.write(`load soundfonts/${fontname}\n`);
            this.process.stdin.write("fonts\n");
            this.currentSoundFont = fontname;
            this.lcdPrint(this.currentSoundFont, 0);
            return this.currentSoundFont;
        });
    }
    restart() {
        return __awaiter(this, void 0, void 0, function* () {
            ringlog_1.ringlog.clear();
            this.log("Killing fluidsynth...");
            this.lcdPrint("restart synth", 1);
            this.process.kill();
            yield this.start();
            this.soundFontLibrary.loadFontList();
        });
    }
}
exports.FluidSynth = FluidSynth;
