import dotenv from "dotenv";
dotenv.config();
import cp from "child_process";
import express from "express";
import http from "http";
import { FluidSynth } from "./fluidsynth";
import path from "path";
import fileUpload from "express-fileupload";
import bodyParser from "body-parser";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

import chalk from "chalk";
import { Log, ringlog } from "./ringlog";
// import { uploadHandler } from "./upload";
import { LCD } from "./lcd";
import { Dial } from "./dial";

const log = Log(chalk.yellowBright);

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
// app.post(
//   "/upload",
//   uploadHandler(log, () => (soundfonts = initialiseSoundFonts()))
// );

const lcd =
  (process.env.ENABLE_LCD || "false").toLowerCase() === "true"
    ? new LCD()
    : null;

log(`LCD ${lcd ? "enabled" : "disabled"}`);
const lcdPrint = (msg: string, line: number) => {
  if (lcd) {
    lcd.print((msg || "").padEnd(16, " "), line);
  }
};
lcdPrint("Starting...", 0);

const fluidsynth = new FluidSynth(lcdPrint);
/**
 * Rotary Dial
 */
let shutdownMode = false;
const _ =
  (process.env.ENABLE_LCD || "false").toLowerCase() === "true"
    ? new Dial({
        onDown: () =>
          fluidsynth
            .loadPreviousFont()
            .then(() => lcdPrint(fluidsynth.currentSoundFont, 0)),
        onPress: () => {
          console.log("Press handler");
          if (shutdownMode) {
            return shutdown();
          }
          shutdownMode = true;
          const previousLCD = lcd?.content || [""];
          lcd?.print("Press to shutdown...", 0);
          setTimeout(() => {
            shutdownMode = false;
            lcd?.print(previousLCD?.[0], 0);
          }, 3000);
        },
        onUp: () =>
          fluidsynth
            .loadNextFont()
            .then(() => lcdPrint(fluidsynth.currentSoundFont, 0)),
      })
    : null;

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
      fonts: fluidsynth.getFontList(),
      currentSoundfont: fluidsynth.currentSoundFont,
    })
  );
  client.on("changeinst", loadSoundFont);
  client.on("restart_fluidsynth", restartFluidsynth);
  client.on("shutdown", shutdown);
});

async function loadSoundFont(index: number) {
  fluidsynth.ready.then(() => {
    const font = fluidsynth.getFontList()[index];
    fluidsynth.loadFont(font);
  });
}

async function restartFluidsynth() {
  fluidsynth.restart();
}

function shutdown() {
  log("Shutting down computer...");
  lcdPrint("Shutdown...", 1);
  lcd?.lcd.backlight().off();
  cp.execSync("shutdown -h now");
}
