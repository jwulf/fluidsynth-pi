import { FluidSynth } from "./fluidsynth";
import cp from "child_process";
import { Log } from "./ringlog";
import chalk from "chalk";

type MenuMode = "UNSTARTED" | "FONTS" | "SYSTEM";

const log = Log(chalk.yellowBright);

export class Menu {
  private mode: MenuMode = "UNSTARTED";
  public systemMenu: SystemMenu;
  constructor(
    private fluidsynth: FluidSynth,
    private lcdPrint: (msg: string, line: number) => void
  ) {
    this.systemMenu = new SystemMenu(this.lcdPrint, fluidsynth);
    this.fluidsynth.on("fontLoaded", () => {
      log("Loaded");
      if (this.mode === "FONTS") {
        lcdPrint("", 1);
      }
    });
  }

  onPress = () => {
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
        cp.execSync("init 6");
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

  onDown = () => {
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

  onUp = () => {
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

  private showLoadingMessage() {
    log("Loading...");
    this.lcdPrint("Loading...", 1);
  }

  private setFontMode() {
    this.mode = "FONTS";
    this.lcdPrint("", 1);
    this.lcdPrint(this.fluidsynth.currentSoundFont, 0);
  }

  private setSystemMode() {
    this.mode = "SYSTEM";
    this.systemMenu.show();
  }

  public setMode = (mode: MenuMode) => {
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
}

class SystemMenu {
  static RESTART = 0 as const;
  static SHUTDOWN = 1 as const;
  static FONTS = 2 as const;
  private index = 0;
  private options = ["Restart synth", "Shutdown", "Exit menu"];
  private shutdownMode = false;
  constructor(
    private lcdPrint: (msg: string, line: number) => void,
    private fluidsynth: FluidSynth
  ) {}

  private print() {
    const msg = this.options[this.index].padEnd(14, " ");
    this.lcdPrint(`:arrowright: ${msg}`, 0);
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

  handlePress(setMode: (mode: MenuMode) => void) {
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
        } else {
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

  public doShutdown() {
    log("Shutting down computer...");
    this.lcdPrint("Shutdown...", 1);
    cp.execSync("shutdown -h now");
  }
}
