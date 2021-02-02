import dotenv from "dotenv";
dotenv.config();

import { FluidSynth } from "./fluidsynth";
import chalk from "chalk";
import { Log } from "./ringlog";
import { LCD } from "./lcd";
import { Dial } from "./dial";
import { Menu } from "./Menu";
import { startWebInterface } from "./web-ui";

const log = Log(chalk.yellowBright);

const lcdEnabled = (process.env.ENABLE_LCD || "false").toLowerCase() === "true";
const lcd = lcdEnabled ? new LCD() : null;

log(`LCD ${lcdEnabled ? "enabled" : "disabled"}`);

const lcdPrint = (msg: string, line: number) => {
  if (lcd) {
    return lcd.print((msg || "").replace(".sf2", "").padEnd(16, " "), line);
  }
};
lcdPrint("Starting...", 0);

process.on("exit", (code) => {
  lcdPrint("Stopped...", 0);
  lcdPrint("", 1);
});

const fluidsynth: FluidSynth = new FluidSynth(
  lcdPrint,
  () => menu?.setMode("FONTS"),
  () => menu?.setMode("UNSTARTED")
);
const menu = new Menu(fluidsynth, lcdPrint);

/**
 * Rotary Dial
 */
const __dial = lcdEnabled
  ? new Dial({
      onDown: () => menu.onDown(),
      onPress: () => menu.onPress(),
      onUp: () => menu.onUp(),
    })
  : null;

const webUIEnabled =
  (process.env.WEBUI_DISABLED || "false").toLowerCase() !== "true";

log(`Web UI: ${webUIEnabled ? "enabled" : "disabled"}`);
if (webUIEnabled) {
  startWebInterface(fluidsynth, menu);
}
