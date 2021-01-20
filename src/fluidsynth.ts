import cp from "child_process";
import chalk from "chalk";

export function startFluidSynth(
  fluidsynthArgs: string,
  aconnectArgs: string
): Promise<cp.ChildProcessWithoutNullStreams> {
  let ready = false;
  return new Promise((resolve, reject) => {
    const fluidsynth = cp.spawn("fluidsynth", fluidsynthArgs.split(" "));

    fluidsynth.stdout.on("data", (data) => {
      const message = data.toString();
      ready = ready || message.includes(">");
      console.log(chalk.green(data.toString()));
    });
    fluidsynth.stderr.on("error", (error) =>
      console.error(chalk.red(error.toString()))
    );
    const watcher = setInterval(() => {
      if (ready) {
        clearInterval(watcher);
        // cp.execSync(`aconnect ${aconnectArgs}`);
        resolve(fluidsynth);
      }
    }, 1000);
  });
}
