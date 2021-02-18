import dotenv from "dotenv";
dotenv.config();

// import { startWebInterface } from "./web-ui";
import { start, dispatch } from "nact";
import {
  LcdController,
  LcdControllerActorMessages,
} from "./LcdControllerActor";
import {
  MenuController,
  MenuControllerActorMessages,
} from "./MenuControllerActor";
import { createDial } from "./DialControllerActor";
import { Fluidsynth } from "./FluidSynthActor";
import { SoundFontLibrary } from "./SoundFontLibraryActor";
import { FavoriteMenu } from "./MenuFavorites";
import { FontExplorerMenu } from "./MenuFontExplorer";

const system = start();
export const lcdController = LcdController(system);
dispatch(lcdController, {
  type: LcdControllerActorMessages.PRINT,
  text: "Starting...",
  line: 0,
});

export const soundFontLibrary = SoundFontLibrary(system);
export const menuController = MenuController(system);

dispatch(menuController, {
  type: MenuControllerActorMessages.ACTIVATE_MENU,
  menuName: "FAVORITES",
  state: {},
});

export const fluidSynth = Fluidsynth(system);
// @TODO: load default font
createDial(menuController);

process.on("exit", () => {
  dispatch(lcdController, {
    type: LcdControllerActorMessages.PRINT,
    text: "Stopped...",
    line: 0,
  });
  dispatch(lcdController, {
    type: LcdControllerActorMessages.PRINT,
    text: "",
    line: 1,
  });
});

// Disable web interface during refactor

// const webUIEnabled =
//   (process.env.WEBUI_ENABLED || "true").toLowerCase() !== "false";

// log(`Web UI: ${webUIEnabled ? "enabled" : "disabled"}`);
// if (webUIEnabled) {
//   startWebInterface(fluidsynth, menu);
// }
