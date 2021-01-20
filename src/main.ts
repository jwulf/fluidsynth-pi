import express from "express";
const app = express();
import http from "http";
import { startFluidSynth } from "./fluidsynth";
import path from "path";
import os from "os";
import fs from "fs";

const server = http.createServer(app);
import { Server } from "socket.io";
import chalk from "chalk";
const io = new Server(server);

app.use(express.static(path.join(__dirname, "..", "node_modules")));
app.use(express.static(path.join(__dirname, "..", "public")));

// app.get("/", function (req, res, next) {
//   res.sendFile(path.join(__dirname, "..", "public", "index.html"));
// });

let fluidsynthArgs = "-r 48000 --gain 2 --o synth.polyphony=4";
if (os.type() === "Linux") {
  fluidsynthArgs += "--audio-driver=alsa ";
}
const aconnectArgs = "16:0 128:0";
const soundfonts = fs.readdirSync(path.join(__dirname, "..", "soundfonts"));
let currentSoundfont = "Loft.sf2";
let fontIndex = 1;

const log = (msg: string) => console.log(chalk.yellowBright(msg));
const fluidsynth = startFluidSynth(fluidsynthArgs, aconnectArgs);

fluidsynth.then((fluidsynth) => {
  console.log("Ready");
  const index = soundfonts.indexOf(currentSoundfont);
  const font = soundfonts[index];
  fluidsynth.stdin.write(`load soundfonts/${font}\n`);
  fluidsynth.stdin.write("fonts\n");
  server.listen(3000);
  log("Listening on port 3000");
});

io.on("connection", (client) => {
  //   console.log("client connected");
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
});
