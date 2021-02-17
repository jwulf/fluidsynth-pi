import cp from "child_process";
import chalk from "chalk";
import os from "os";
import { Log, ringlog } from "./ringlog";
import { SoundFontLibrary } from "./SoundFontLibrary";
import { EventEmitter } from "events";

const priority = process.env.FLUIDSYNTH_PRIORITY || "0";

const defaultFluidsynthArgs =
  "--sample-rate 48000 --gain 3 -o synth.polyphony=16" + os.type() === "Linux"
    ? " --audio-driver=alsa"
    : "";
const argsFromEnv = process.env.FLUIDSYNTH_ARGS;
const fluidsynthArgs = argsFromEnv || defaultFluidsynthArgs;
const aconnectArgs = process.env.ACONNECT_ARGS || "16:0 128:0";

export class FluidSynth extends EventEmitter {
  ready: Promise<unknown>;
  currentSoundFont!: string;
  private soundFontLibrary: SoundFontLibrary;
  private log: (msg: string) => void = Log(chalk.green);
  private errorlog: (msg: string) => void;
  private loadedFontCount = 0;
  private process!: cp.ChildProcessWithoutNullStreams;

  constructor(
    private lcdPrint: (msg: string, line: number) => void,
    onSuccess: () => void,
    onError: (error: string) => void
  ) {
    super();

    this.log(`FluidSynth args: ${fluidsynthArgs}`);
    lcdPrint("Starting...", 0);
    this.errorlog = Log(chalk.redBright);
    this.soundFontLibrary = new SoundFontLibrary();
    this.ready = this.start()
      .then(() => this._loadFont(this.soundFontLibrary.currentSoundfont))
      .then(onSuccess)
      .catch(onError);
  }

  start() {
    return new Promise((resolve, reject) => {
      let blockForReady = true;

      this.process = cp.spawn("nice", [
        "-n",
        priority,
        "fluidsynth",
        ...fluidsynthArgs.split(" "),
      ]);
      this.process.stderr.on("data", (error) => {
        this.errorlog(error.toString());
        if (blockForReady) {
          blockForReady = false;
          return reject(error.toString());
        }
      });
      this.process.stdout.on("data", (data) => {
        const message = data.toString();
        if (message.includes("loaded SoundFont has ID")) {
          this.emit("fontLoaded");
        }
        if (blockForReady && message.includes(">")) {
          blockForReady = false;
          if (os.type() === "Linux") {
            try {
              cp.execSync(`aconnect ${aconnectArgs}`);
            } catch (e) {
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

  async loadNextFont() {
    return this._loadFont(this.soundFontLibrary.scrollToNextSoundFont());
  }

  async loadPreviousFont() {
    return this._loadFont(this.soundFontLibrary.scrollToPreviousSoundFont());
  }

  async loadFont(fontname: string) {
    if (this.soundFontLibrary.soundFonts.includes(fontname)) {
      this._loadFont(fontname);
      this.soundFontLibrary.currentSoundfont = fontname;
      this.soundFontLibrary.currentSoundfontIndex = this.soundFontLibrary.soundFonts.indexOf(
        fontname
      );
    } else {
      this.log("Soundfont not found!");
    }
  }

  private async _loadFont(fontname: string) {
    if (this.loadedFontCount === 22) {
      await this.restart();
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
  }

  async restart() {
    ringlog.clear();
    this.log("Killing fluidsynth...");
    this.lcdPrint("restart synth", 1);
    this.process.kill();
    this.loadedFontCount = 0;
    return this.start()
      .then(() => this.soundFontLibrary.loadFontList())
      .then(() => this._loadFont(this.soundFontLibrary.currentSoundfont));
  }
}
