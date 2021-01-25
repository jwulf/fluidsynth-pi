import dotenv from "dotenv";
dotenv.config();
import cp from "child_process";
import express from "express";
import http from "http";
import { startFluidSynth } from "./fluidsynth";
import path from "path";
import os from "os";
import fs from "fs";
import fileUpload from "express-fileupload";
import bodyParser from "body-parser";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

import chalk from "chalk";
import { RingLog } from "./ringlog";
import { uploadHandler } from "./upload";
import { LCD } from "./lcd";

const ringlog = new RingLog(40);
const log = (msg: string) => {
  console.log(chalk.yellowBright(msg));
  ringlog.log(msg);
};

app.use(
  fileUpload({
    createParentPath: true,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "..", "node_modules")));
app.use(express.static(path.join(__dirname, "..", "public")));

// Upload soundfont - have to figure out how to get this work on insecure domain
app.post(
  "/upload",
  uploadHandler(log, () => (soundfonts = initialiseSoundFonts()))
);

const aconnectArgs = "16:0 128:0";
let soundfonts: string[];
let currentSoundfont: string;
let loadedFontID = 1;

const lcd =
  (process.env.ENABLE_LCD || "false").toLowerCase() === "true"
    ? new LCD()
    : null;
const lcdPrint = (msg: string, line: number) => {
  if (lcd) {
    lcd.print(msg, line);
  }
};
let fluidsynth = initialiseFluidsynth();

function initialiseSoundFonts() {
  currentSoundfont = process.env.DEFAULT_SOUNDFONT || "Loft.sf2";
  const sf = fs.readdirSync(path.join(__dirname, "..", "soundfonts"));
  log(`Found soundfonts: \n * ${sf.join("\n * ")}`);
  return sf;
}

async function initialiseFluidsynth() {
  const defaultFluidsynthArgs =
    "-r 48000 --gain 2 --o synth.polyphony=16" + os.type() === "Linux"
      ? " --audio-driver=alsa "
      : "";
  const argsFromEnv = process.env.FLUIDSYNTH_ARGS;
  const fluidsynthArgs = argsFromEnv || defaultFluidsynthArgs;

  log(`FluidSynth args: ${fluidsynthArgs}`);
  const fluidsynth = await startFluidSynth(
    fluidsynthArgs,
    aconnectArgs,
    ringlog
  );
  log("Ready");
  lcdPrint("Fluidsynth running", 1);
  loadedFontID = 1;
  soundfonts = initialiseSoundFonts();
  const index = soundfonts.indexOf(currentSoundfont);
  const font = soundfonts[index];
  fluidsynth.stdin.write(`load soundfonts/${font}\n`);
  fluidsynth.stdin.write("fonts\n");
  return fluidsynth;
}

server.listen(3000);
log("Webapp listening on port 3000");

io.on("connection", (client) => {
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
  client.on("changeinst", async (index: number) => {
    log(`Changing to ${soundfonts[index]}...`);
    if ((loadedFontID = 22)) {
      await restartFluidsynth();
    }
    fluidsynth.then((fluidsynth) => {
      fluidsynth.stdin.write(`unload ${loadedFontID++}\n`);
      const font = soundfonts[index];
      currentSoundfont = font;
      fluidsynth.stdin.write(`load soundfonts/${font}\n`);
      fluidsynth.stdin.write(`fonts\n`);
      lcdPrint(font, 0);
    });
  });
  client.on("restart_fluidsynth", restartFluidsynth);
  client.on("shutdown", () => {
    log("Shutting down computer...");
    lcdPrint("Shutting done...", 1);
    cp.execSync("shutdown -h now");
  });
});

async function restartFluidsynth() {
  log("Killing fluidsynth...");
  lcdPrint("Restart fluidsynth", 1);
  fluidsynth.then((f) => {
    ringlog.clear();
    f.kill();
    fluidsynth = initialiseFluidsynth();
  });
}
