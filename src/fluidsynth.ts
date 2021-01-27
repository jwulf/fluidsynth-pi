import cp from "child_process";
import chalk from "chalk";
import os from "os";
import { Log } from "./ringlog";

export function startFluidSynth(
  fluidsynthArgs: string,
  aconnectArgs: string
): Promise<cp.ChildProcessWithoutNullStreams> {
  let ready = false;
  const log = Log(chalk.green);
  const errorlog = Log(chalk.redBright);
  return new Promise((resolve, reject) => {
    const fluidsynth = cp.spawn("fluidsynth", fluidsynthArgs.split(" "));

    fluidsynth.stdout.on("data", (data) => {
      const message = data.toString();
      ready = ready || message.includes(">");
      log(data.toString());
    });
    fluidsynth.stderr.on("data", (error) => errorlog(error.toString()));
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
