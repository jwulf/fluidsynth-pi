import path from "path";
import fs from "fs";
import { Log } from "./ringlog";
import chalk from "chalk";

const log = Log(chalk.yellowBright);

export class SoundFontLibrary {
  currentSoundfont: string;
  soundFonts: string[];
  currentSoundfontIndex: number;
  loadedFontCount = 1;

  constructor() {
    const { soundFonts, currentSoundfont } = this.loadFontList();
    this.soundFonts = soundFonts;
    this.currentSoundfont = currentSoundfont;
    this.currentSoundfontIndex = this.soundFonts.indexOf(this.currentSoundfont);
  }

  loadFontList() {
    const sf = fs.readdirSync(path.join(__dirname, "..", "soundfonts"));

    let currentSoundfont = this.currentSoundfont;
    const noSoundFontLoadedYet = !currentSoundfont;
    const loadedSoundfontGone = !sf.includes(currentSoundfont);

    if (noSoundFontLoadedYet || loadedSoundfontGone) {
      const defaultSoundfont = process.env.DEFAULT_SOUNDFONT;
      if (defaultSoundfont && sf.includes(defaultSoundfont)) {
        currentSoundfont = defaultSoundfont;
      } else {
        currentSoundfont = sf[0];
      }
    }
    this.currentSoundfontIndex = sf.indexOf(currentSoundfont);
    log(`Found soundfonts: \n * ${sf.join("\n * ")}`);
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
