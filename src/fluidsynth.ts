import cp from "child_process";
import chalk from "chalk";
import os from "os";
import { RingLog } from "./ringlog";

export function startFluidSynth(
  fluidsynthArgs: string,
  aconnectArgs: string,
  ringlog: RingLog
): Promise<cp.ChildProcessWithoutNullStreams> {
  let ready = false;
  return new Promise((resolve, reject) => {
    const fluidsynth = cp.spawn("fluidsynth", fluidsynthArgs.split(" "));

    fluidsynth.stdout.on("data", (data) => {
      const message = data.toString();
      ready = ready || message.includes(">");
      console.log(chalk.green(data.toString()));
      ringlog.log(data.toString());
    });
    fluidsynth.stderr.on("data", (error) => {
      console.error(chalk.red(error.toString()));
      ringlog.log(error.toString());
    });
    const watcher = setInterval(() => {
      if (ready) {
        clearInterval(watcher);
        if (os.type() === "Linux") {
          cp.execSync(`aconnect ${aconnectArgs}`);
        }
        resolve(fluidsynth);
      }
    }, 1000);
  });
}
