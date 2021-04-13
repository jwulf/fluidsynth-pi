"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fluidSynth = exports.menuController = exports.soundFontLibrary = exports.lcdController = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const nact_1 = require("nact");
const LcdControllerActor_1 = require("./LcdControllerActor");
const MenuControllerActor_1 = require("./MenuControllerActor");
const DialControllerActor_1 = require("./DialControllerActor");
const FluidSynthActor_1 = require("./FluidSynthActor");
const SoundFontLibraryActor_1 = require("./SoundFontLibraryActor");
const system = nact_1.start();
exports.lcdController = LcdControllerActor_1.LcdController(system);
nact_1.dispatch(exports.lcdController, {
    type: LcdControllerActor_1.LcdControllerActorMessages.PRINT,
    text: "Starting...",
    line: 0,
});
exports.soundFontLibrary = SoundFontLibraryActor_1.SoundFontLibrary(system);
exports.menuController = MenuControllerActor_1.MenuController(system);
exports.fluidSynth = FluidSynthActor_1.Fluidsynth(system);
nact_1.query(exports.fluidSynth, (sender) => ({ sender, type: FluidSynthActor_1.FluidSynthMessageType.START_SYNTH }), 15000)
    .then(() => nact_1.dispatch(exports.menuController, {
    type: MenuControllerActor_1.MenuControllerActorMessages.ACTIVATE_MENU,
    menuName: "FAVORITES",
}))
    .catch(() => nact_1.dispatch(exports.lcdController, {
    type: LcdControllerActor_1.LcdControllerActorMessages.PRINT,
    text: "Synth error",
    line: 0,
}));
// @TODO: load default font
DialControllerActor_1.createDial(exports.menuController);
process.on("exit", () => {
    nact_1.dispatch(exports.lcdController, {
        type: LcdControllerActor_1.LcdControllerActorMessages.PRINT,
        text: "Stopped...",
        line: 0,
    });
    nact_1.dispatch(exports.lcdController, {
        type: LcdControllerActor_1.LcdControllerActorMessages.PRINT,
        text: "",
        line: 1,
    });
});
