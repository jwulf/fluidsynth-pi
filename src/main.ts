import dotenv from "dotenv";
dotenv.config();
import express from "express";
const app = express();
import http from "http";
import { startFluidSynth } from "./fluidsynth";
import path from "path";
import os from "os";
import fs from "fs";

const server = http.createServer(app);
import { Server } from "socket.io";
const io = new Server(server);

import chalk from "chalk";
import { RingLog } from "./ringlog";

const ringlog = new RingLog(40);
const log = (msg: string) => {
  console.log(chalk.yellowBright(msg));
  ringlog.log(msg);
};

app.use(express.static(path.join(__dirname, "..", "node_modules")));
app.use(express.static(path.join(__dirname, "..", "public")));

// app.get("/", function (req, res, next) {
//   res.sendFile(path.join(__dirname, "..", "public", "index.html"));
// });

let fluidsynthArgs = "-r 48000 --gain 2 --o synth.polyphony=16";
if (os.type() === "Linux") {
  fluidsynthArgs += " --audio-driver=alsa ";
}
if (process.env.FLUIDSYNTH_ARGS) {
  fluidsynthArgs = process.env.FLUIDSYNTH_ARGS;
}
log(`FluidSynth args: ${fluidsynthArgs}`);

const aconnectArgs = "16:0 128:0";
const soundfonts = fs.readdirSync(path.join(__dirname, "..", "soundfonts"));
log(`Found soundfonts: ${JSON.stringify(soundfonts)}`);
let currentSoundfont = "Loft.sf2";
let fontIndex = 1;

let fluidsynth = initialiseFluidsynth();

async function initialiseFluidsynth() {
  const fluidsynth = await startFluidSynth(
    fluidsynthArgs,
    aconnectArgs,
    ringlog
  );
  console.log("Ready");
  fontIndex = 1;
  const index = soundfonts.indexOf(currentSoundfont);
  const font = soundfonts[index];
  fluidsynth.stdin.write(`load soundfonts/${font}\n`);
  fluidsynth.stdin.write("fonts\n");
  return fluidsynth;
}

server.listen(3000);
log("Listening on port 3000");

io.on("connection", (client) => {
  //   console.log("client connected");
  client.emit("log", ringlog.messages.join("\n"));
  const onLogMessage = (msg: string) => client.emit("log", msg);
  ringlog.on("message", onLogMessage);

  client.on("disconnection", () =>
    ringlog.removeListener("message", onLogMessage)
  );
  client.on("getinstruments", () =>
    io.emit("instrumentdump", {
      fonts: soundfonts,
      currentSoundfont,
    })
  );
  client.on("changeinst", (index: number) => {
    log(`Changing to ${soundfonts[index]}...`);
    fluidsynth.then((fluidsynth) => {
      fluidsynth.stdin.write(`unload ${fontIndex++}\n`);
      const font = soundfonts[index];
      currentSoundfont = font;
      fluidsynth.stdin.write(`load soundfonts/${font}\n`);
      fluidsynth.stdin.write(`fonts\n`);
    });
  });
  client.on("restart_fluidsynth", () => {
    log("Killing fluidsynth...");
    fluidsynth.then((f) => {
      ringlog.clear();
      f.kill();
      fluidsynth = initialiseFluidsynth();
    });
  });
});
