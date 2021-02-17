"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FluidSynthMessageType = exports.Fluidsynth = void 0;
const child_process_1 = __importDefault(require("child_process"));
const chalk_1 = __importDefault(require("chalk"));
const os_1 = __importDefault(require("os"));
const ringlog_1 = require("./ringlog");
const nact_1 = require("nact");
const ActorConstants_1 = require("./ActorConstants");
const main_1 = require("./main");
const LcdControllerActor_1 = require("./LcdControllerActor");
const SoundFontLibraryActor_1 = require("./SoundFontLibraryActor");
const priority = process.env.FLUIDSYNTH_PRIORITY || "0";
const defaultFluidsynthArgs = "--sample-rate 48000 --gain 3 -o synth.polyphony=16" + os_1.default.type() === "Linux"
    ? " --audio-driver=alsa"
    : "";
const argsFromEnv = process.env.FLUIDSYNTH_ARGS;
const fluidsynthArgs = argsFromEnv || defaultFluidsynthArgs;
const aconnectArgs = process.env.ACONNECT_ARGS || "16:0 128:0";
const log = ringlog_1.Log(chalk_1.default.green);
const errorlog = ringlog_1.Log(chalk_1.default.redBright);
function actorFn(state = { loadedFontCount: 0 }, msg, ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        if (msg.type === FluidSynthMessageType.START_SYNTH) {
            const { process, ready } = startSynth(state);
            ready.then(() => nact_1.dispatch(msg.sender, { result: ActorConstants_1.OPERATION_SUCCESS, process }));
            ready.catch((error) => nact_1.dispatch(msg.sender, {
                result: ActorConstants_1.OPERATION_FAILED,
                detail: error,
            }));
            return Object.assign(Object.assign({}, state), { process });
        }
        if (msg.type === FluidSynthMessageType.LOAD_FONT) {
            const { sender } = msg;
            const { filename, bank, instrument } = msg.entry;
            if (filename === state.loadedFont.filename &&
                bank === state.loadedFont.bank &&
                instrument === state.loadedFont.bank) {
                return state;
            }
            if (!SoundFontLibraryActor_1.fontExists(filename)) {
                nact_1.dispatch(main_1.lcdController, {
                    type: LcdControllerActor_1.LcdControllerActorMessages.SHOW_TOAST,
                    durationMs: 2000,
                    id: "FONT_NOT_FOUND",
                    text: `File not found.`,
                });
                return state;
            }
            const { process, loadedFontCount } = yield getSynthForFontLoad(state);
            const selectInstrument = ({ bank, fontId, instrument, }) => process.stdin.write(`select 15 ${fontId} ${bank} ${instrument}`);
            if (filename === state.loadedFont.filename) {
                selectInstrument({ bank, instrument, fontId: state.loadedFontCount });
                return Object.assign(Object.assign({}, state), { loadedFont: msg.entry });
            }
            const listener = (data) => {
                const message = data.toString();
                if (message.includes("loaded SoundFont has ID")) {
                    if (msg.entry.bank !== 0 && msg.entry.instrument !== 0) {
                        // load bank and instrument
                        const fontId = state.loadedFontCount + 1;
                        selectInstrument({
                            bank,
                            instrument,
                            fontId,
                        });
                    }
                    nact_1.dispatch(sender, { result: ActorConstants_1.OPERATION_SUCCESS });
                    nact_1.dispatch(main_1.lcdController, {
                        type: LcdControllerActor_1.LcdControllerActorMessages.HIDE_TOAST,
                        id: "LOADING_FONT",
                    });
                    process.stdout.removeListener("data", listener);
                }
            };
            state.process.stdout.on("data", listener);
            log(`Loading ${filename}...`);
            nact_1.dispatch(main_1.lcdController, {
                type: LcdControllerActor_1.LcdControllerActorMessages.SHOW_TOAST,
                id: "LOADING_FONT",
                durationMs: 0,
                text: `Load ${filename}`,
            });
            if (loadedFontCount !== 0) {
                process.stdin.write(`unload ${loadedFontCount}\n`);
            }
            process.stdin.write(`load soundfonts/${filename}\n`);
            process.stdin.write("fonts\n");
            // Note: Increments and updates loadedfont even if there was an error loading the font
            return Object.assign(Object.assign({}, state), { process, loadedFontCount: loadedFontCount + 1, loadedFont: msg.entry });
        }
    });
}
function startSynth(state) {
    log(`FluidSynth args: ${fluidsynthArgs}`);
    nact_1.dispatch(main_1.lcdController, {
        type: LcdControllerActor_1.LcdControllerActorMessages.SHOW_TOAST,
        text: "Starting synth...",
        id: "STARTING_SYNTH",
        durationMs: 0,
    });
    if (state.process) {
        state.process.kill();
    }
    const process = child_process_1.default.spawn("nice", [
        "-n",
        priority,
        "fluidsynth",
        ...fluidsynthArgs.split(" "),
    ]);
    const ready = new Promise((resolve, reject) => {
        let blockForReady = true;
        process.stderr.on("data", (error) => {
            errorlog(error.toString());
            if (blockForReady) {
                blockForReady = false;
                return reject(error.toString());
            }
        });
        process.stdout.on("data", (data) => {
            const message = data.toString();
            if (blockForReady && message.includes(">")) {
                blockForReady = false;
                if (os_1.default.type() === "Linux") {
                    try {
                        child_process_1.default.execSync(`aconnect ${aconnectArgs}`);
                    }
                    catch (e) {
                        return reject(e.toString());
                    }
                }
                return resolve("Ready");
            }
            log(data.toString() + " >>");
        });
    });
    return { process, ready };
}
function getSynthForFontLoad(state) {
    return __awaiter(this, void 0, void 0, function* () {
        // For some reason, the synth stops working when you load 22 fonts, so
        // we restart it to work around this
        if (state.loadedFontCount < 22) {
            return { process: state.process, loadedFontCount: state.loadedFontCount };
        }
        const { process, ready } = startSynth(state);
        yield ready;
        return { process, loadedFontCount: 0 };
    });
}
const Fluidsynth = (root) => nact_1.spawn(root, actorFn, ActorConstants_1.Actor.Fluidsynth); //as Ref<FluidSynthMessage>;
exports.Fluidsynth = Fluidsynth;
var FluidSynthMessageType;
(function (FluidSynthMessageType) {
    FluidSynthMessageType["START_SYNTH"] = "START_SYNTH";
    FluidSynthMessageType["LOAD_FONT"] = "LOAD_FONT";
})(FluidSynthMessageType = exports.FluidSynthMessageType || (exports.FluidSynthMessageType = {}));
