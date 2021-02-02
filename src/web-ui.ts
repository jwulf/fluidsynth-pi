import express from "express";
import http from "http";
import path from "path";
import fileUpload from "express-fileupload";
import bodyParser from "body-parser";
import { Server } from "socket.io";
import { Log, ringlog } from "./ringlog";
import chalk from "chalk";
import { FluidSynth } from "./fluidsynth";
import { Menu } from "./Menu";

const log = Log(chalk.yellowBright);

export function startWebInterface(fluidsynth: FluidSynth, menu: Menu) {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server);

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
    client.on("shutdown", () => menu.systemMenu.doShutdown());
  });

  async function loadSoundFont(index: number) {
    fluidsynth.ready.then(() => {
      const font = fluidsynth.getFontList()[index];
      fluidsynth.loadFont(font);
      menu.setMode("FONTS");
    });
  }

  async function restartFluidsynth() {
    fluidsynth.restart();
  }
}
