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
        this.lcdPrint("Restarting...", 0);
        this.lcdPrint("", 1);
        setTimeout(() => cp.execSync("init 6"), 800);
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

enum SystemMenuItem {
  RESTART = 0,
  SHUTDOWN = 1,
  UPDATE = 2,
  FONTS = 3,
}

class SystemMenu {
  private index: SystemMenuItem = SystemMenuItem.RESTART;
  private options = ["Restart synth", "Shutdown", "Update Code", "Exit menu"];
  private shutdownMode = false;
  private updating = false;
  constructor(
    private lcdPrint: (msg: string, line: number) => void,
    private fluidsynth: FluidSynth
  ) {}

  private displayMenu() {
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

  handlePress(setMode: (mode: MenuMode) => void) {
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
        } else {
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
            log(cp.execSync("git reset --hard").toString());
            log(cp.execSync("git pull").toString());
            this.lcdPrint("Success", 1);
            log("Update succeeded");
          } catch (e) {
            this.lcdPrint("Error", 1);
            log("Update failed");
          }
          this.updating = false;
        }, 800);
        break;
      }
      default:
        const exhaustiveCheck: never = this.index;
        throw new Error(`Unhandled case: ${exhaustiveCheck}`);
    }
  }

  public doShutdown() {
    log("Shutting down computer...");
    this.lcdPrint("", 0);
    this.lcdPrint("Shutdown.", 1);
    setTimeout(() => cp.execSync("shutdown -h now"), 800);
  }
}
