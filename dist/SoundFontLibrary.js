"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoundFontLibrary = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const ringlog_1 = require("./ringlog");
const chalk_1 = __importDefault(require("chalk"));
const log = ringlog_1.Log(chalk_1.default.yellowBright);
class SoundFontLibrary {
    constructor() {
        this.loadedFontCount = 1;
        const { soundFonts, currentSoundfont } = this.loadFontList();
        this.soundFonts = soundFonts;
        this.currentSoundfont = currentSoundfont;
        this.currentSoundfontIndex = this.soundFonts.indexOf(this.currentSoundfont);
    }
    loadFontList() {
        const sf = fs_1.default.readdirSync(path_1.default.join(__dirname, "..", "soundfonts"));
        let currentSoundfont = this.currentSoundfont;
        const noSoundFontLoadedYet = !currentSoundfont;
        const loadedSoundfontGone = !sf.includes(currentSoundfont);
        if (noSoundFontLoadedYet || loadedSoundfontGone) {
            const defaultSoundfont = process.env.DEFAULT_SOUNDFONT;
            if (defaultSoundfont && sf.includes(defaultSoundfont)) {
                currentSoundfont = defaultSoundfont;
            }
            else {
                currentSoundfont = sf[0];
            }
        }
        this.currentSoundfontIndex = sf.indexOf(currentSoundfont);
        log(`Found soundfonts: \n * ${sf.join("\n * ")}`);
        this.currentSoundfont = currentSoundfont;
        this.soundFonts = this.soundFonts;
        return { soundFonts: sf, currentSoundfont };
    }
    scrollToNextSoundFont() {
        this.currentSoundfontIndex++;
        this.currentSoundfontIndex =
            this.currentSoundfontIndex % this.soundFonts.length;
        this.currentSoundfont = this.soundFonts[this.currentSoundfontIndex];
        return this.currentSoundfont;
    }
    scrollToPreviousSoundFont() {
        this.currentSoundfontIndex--;
        this.currentSoundfontIndex =
            this.currentSoundfontIndex < 0
                ? this.soundFonts.length - 1
                : this.currentSoundfontIndex;
        this.currentSoundfont = this.soundFonts[this.currentSoundfontIndex];
        return this.currentSoundfont;
    }
}
exports.SoundFontLibrary = SoundFontLibrary;
