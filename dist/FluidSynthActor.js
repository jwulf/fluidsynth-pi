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
// import { startWebInterface } from "./web-ui";
const priority = process.env.FLUIDSYNTH_PRIORITY || "0";
const midiChannel = process.env.MIDI_CHANNEL || "15";
const defaultFluidsynthArgs = "--sample-rate 48000 --gain 2 -o synth.polyphony=16" + os_1.default.type() === "Linux"
    ? " --audio-driver=alsa"
    : "";
const argsFromEnv = process.env.FLUIDSYNTH_ARGS;
const fluidsynthArgs = argsFromEnv || defaultFluidsynthArgs;
const aconnectArgs = process.env.ACONNECT_ARGS || "14:0 128:0";
const log = ringlog_1.Log(chalk_1.default.green);
const errorlog = ringlog_1.Log(chalk_1.default.redBright);
function actorFn(state = { loadedFontCount: 0 }, msg, ctx) {
    var _a, _b, _c, _d;
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
        if (msg.type === FluidSynthMessageType.GET_INSTRUMENTS) {
            const fontAlreadyLoaded = ((_a = state.loadedFont) === null || _a === void 0 ? void 0 : _a.filename) === msg.font.filename;
            const { loadedFont, loadedFontCount } = fontAlreadyLoaded
                ? state
                : yield loadFont(state, msg.font);
            const listener = (data) => {
                const lines = data.toString().split("\n");
                lines.shift();
                const instruments = lines === null || lines === void 0 ? void 0 : lines.map((l) => ({
                    bank: parseInt(l.substr(0, 3), 10),
                    instrument: parseInt(l.substr(4, 3), 10),
                    displayName: l.substring(8),
                    filename: msg.font.filename,
                })).filter((s) => !isNaN(s.bank));
                state.process.stdout.removeListener("data", listener);
                return nact_1.dispatch(msg.sender, instruments);
            };
            state.process.stdout.on("data", listener);
            state.process.stdin.write(`inst ${loadedFontCount}\n`);
            return Object.assign(Object.assign({}, state), { loadedFont, loadedFontCount });
        }
        if (msg.type === FluidSynthMessageType.LOAD_FONT) {
            const { sender } = msg;
            const { filename, bank, instrument } = msg.entry;
            if (filename === ((_b = state.loadedFont) === null || _b === void 0 ? void 0 : _b.filename) &&
                bank === ((_c = state.loadedFont) === null || _c === void 0 ? void 0 : _c.bank) &&
                instrument === ((_d = state.loadedFont) === null || _d === void 0 ? void 0 : _d.bank)) {
                nact_1.dispatch(sender, { result: ActorConstants_1.OPERATION_SUCCESS });
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
            const { entry } = msg;
            const { loadedFont, loadedFontCount } = yield loadFont(state, entry);
            nact_1.dispatch(sender, { result: ActorConstants_1.OPERATION_SUCCESS });
            return Object.assign(Object.assign({}, state), { loadedFont, loadedFontCount });
        }
    });
}
function loadFont(state, entry) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { process, loadedFontCount } = yield getSynthForFontLoad(state);
        const { filename, bank, instrument } = entry;
        const selectInstrument = ({ bank, fontId, instrument, }) => process.stdin.write(`select ${midiChannel} ${fontId} ${bank} ${instrument}\n`);
        if (filename === ((_a = state.loadedFont) === null || _a === void 0 ? void 0 : _a.filename)) {
            selectInstrument({ bank, instrument, fontId: state.loadedFontCount });
            return resolve({
                loadedFont: entry,
                loadedFontCount: state.loadedFontCount,
            });
        }
        const listener = (data) => {
            const message = data.toString();
            if (message.includes("loaded SoundFont has ID")) {
                if (entry.bank !== 0 && entry.instrument !== 0) {
                    // load bank and instrument
                    const fontId = loadedFontCount + 1;
                    selectInstrument({
                        bank,
                        instrument,
                        fontId,
                    });
                }
                nact_1.dispatch(main_1.lcdController, {
                    type: LcdControllerActor_1.LcdControllerActorMessages.HIDE_TOAST,
                    id: "LOADING_FONT",
                });
                process.stdout.removeListener("data", listener);
                return resolve({
                    loadedFont: entry,
                    loadedFontCount: loadedFontCount + 1,
                });
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
        // process.stdin.write("fonts\n");
    }));
}
function startSynth(state) {
    log(`FluidSynth args: ${fluidsynthArgs}`);
    nact_1.dispatch(main_1.lcdController, {
        type: LcdControllerActor_1.LcdControllerActorMessages.SHOW_TOAST,
        text: "Starting synth...",
        id: "STARTING_SYNTH",
        durationMs: 500,
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
    FluidSynthMessageType["GET_INSTRUMENTS"] = "GET_INSTRUMENTS";
})(FluidSynthMessageType = exports.FluidSynthMessageType || (exports.FluidSynthMessageType = {}));
