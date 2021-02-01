import { FluidSynth } from "./fluidsynth";
import cp from "child_process";
import { Log } from "./ringlog";
import chalk from "chalk";

type MenuMode = "FONTS" | "SYSTEM";

const log = Log(chalk.yellowBright);

export class Menu {
  private mode: MenuMode = "FONTS";
  public systemMenu: SystemMenu;
  constructor(
    private fluidsynth: FluidSynth,
    private lcdPrint: (msg: string, line: number) => void
  ) {
    this.systemMenu = new SystemMenu(this.lcdPrint, fluidsynth);
  }

  onPress = () => {
    if (this.mode === "FONTS") {
      this.setSystemMode();
    }
    if (this.mode === "SYSTEM") {
      this.systemMenu.handlePress(this.setMode);
    }
  };

  onDown() {
    if (this.mode === "FONTS") {
      this.fluidsynth
        .loadPreviousFont()
        .then(() => this.lcdPrint(this.fluidsynth.currentSoundFont, 0));
    }
    if (this.mode === "SYSTEM") {
      this.systemMenu.showPrevious();
    }
  }

  onUp() {
    if (this.mode === "FONTS") {
      this.fluidsynth
        .loadNextFont()
        .then(() => this.lcdPrint(this.fluidsynth.currentSoundFont, 0));
    }
    if (this.mode === "SYSTEM") {
      this.systemMenu.showNext();
    }
  }

  public setFontMode() {
    this.mode = "FONTS";
    this.lcdPrint("", 1);
    this.lcdPrint(this.fluidsynth.currentSoundFont, 0);
  }

  private setSystemMode() {
    this.mode = "SYSTEM";
    this.systemMenu.show();
  }

  private setMode(mode: MenuMode) {
    switch (mode) {
      case "FONTS": {
        this.setFontMode();
        break;
      }
      case "SYSTEM": {
        this.setSystemMode();
        break;
      }
    }
  }
}

class SystemMenu {
  static RESTART = 0 as const;
  static SHUTDOWN = 1 as const;
  static FONTS = 2 as const;
  private index = 0;
  private options = ["Restart synth", "Shutdown", "Fonts"];
  private shutdownMode = false;
  constructor(
    private lcdPrint: (msg: string, line: number) => void,
    private fluidsynth: FluidSynth
  ) {}

  private print() {
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
