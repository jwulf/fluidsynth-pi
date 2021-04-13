import cp from "child_process";
import chalk from "chalk";
import os from "os";
import { Log } from "./ringlog";
import { ActorSystemRef, dispatch, spawn, Ref, ActorContext } from "nact";
import {
  Actor,
  OperationResult,
  OPERATION_FAILED,
  OPERATION_SUCCESS,
} from "./ActorConstants";
import { lcdController } from "./main";
import { LcdControllerActorMessages } from "./LcdControllerActor";
import { fontExists, SoundFontEntry } from "./SoundFontLibraryActor";
import { CollectionItem } from "./Collection";
import escape from "escape-path-with-spaces";

const priority = process.env.FLUIDSYNTH_PRIORITY || "0";

const midiChannel = process.env.MIDI_CHANNEL || "15";

const defaultFluidsynthArgs =
  "--sample-rate 48000 --gain 3 -o synth.polyphony=16" + os.type() === "Linux"
    ? " --audio-driver=alsa"
    : "";
const argsFromEnv = process.env.FLUIDSYNTH_ARGS;
const fluidsynthArgs = argsFromEnv || defaultFluidsynthArgs;
const aconnectArgs = process.env.ACONNECT_ARGS || "14:0 128:0";

const log = Log(chalk.green);
const errorlog = Log(chalk.redBright);

async function actorFn(
  state: FluidSynthState = { loadedFontCount: 0 } as FluidSynthState,
  msg: FluidSynthMessage,
  ctx: ActorContext<FluidSynthMessage, Ref<any>>
) {
  if (msg.type === FluidSynthMessageType.START_SYNTH) {
    const { process, ready } = startSynth(state);
    ready.then(() =>
      dispatch(msg.sender, { result: OPERATION_SUCCESS, process })
    );
    ready.catch((error) =>
      dispatch(msg.sender, {
        result: OPERATION_FAILED,
        detail: error,
      })
    );
    return { ...state, process };
  }
  if (msg.type === FluidSynthMessageType.GET_INSTRUMENTS) {
    const fontAlreadyLoaded = state.loadedFont?.filename === msg.font.filename;
    const { loadedFont, loadedFontCount } = fontAlreadyLoaded
      ? state
      : await loadFont(state, msg.font);

    const listener = (data: Buffer) => {
      const lines = data.toString().split("\n");
      lines.shift();
      const instruments: SoundFontEntry[] = lines
        ?.map((l) => ({
          bank: parseInt(l.substr(0, 3), 10),
          instrument: parseInt(l.substr(4, 3), 10),
          displayName: l.substring(8),
          filename: msg.font.filename,
        }))
        .filter((s) => !isNaN(s.bank));
      state.process.stdout.removeListener("data", listener);
      return dispatch(msg.sender, instruments);
    };
    state.process.stdout.on("data", listener);
    state.process.stdin.write(`inst ${loadedFontCount}\n`);
    return { ...state, loadedFont, loadedFontCount };
  }
  if (msg.type === FluidSynthMessageType.LOAD_FONT) {
    const { sender } = msg;
    const { filename, bank, instrument } = msg.entry;
    if (
      filename === state.loadedFont?.filename &&
      bank === state.loadedFont?.bank &&
      instrument === state.loadedFont?.bank
    ) {
      dispatch(sender, { result: OPERATION_SUCCESS });
      return state;
    }
    if (!fontExists(filename)) {
      dispatch(lcdController, {
        type: LcdControllerActorMessages.SHOW_TOAST,
        durationMs: 2000,
        id: "FONT_NOT_FOUND",
        text: `File not found.`,
      });
      return state;
    }
    const { entry } = msg;
    const { loadedFont, loadedFontCount } = await loadFont(state, entry);
    dispatch(sender, { result: OPERATION_SUCCESS });
    return { ...state, loadedFont, loadedFontCount };
  }
}

function loadFont(
  state: FluidSynthState,
  entry: CollectionItem<SoundFontEntry>
): Promise<{
  loadedFont: CollectionItem<SoundFontEntry>;
  loadedFontCount: number;
}> {
  return new Promise(async (resolve, reject) => {
    const { process, loadedFontCount } = await getSynthForFontLoad(state);
    const { filename, bank, instrument } = entry;

    const selectInstrument = ({
      bank,
      fontId,
      instrument,
    }: {
      bank: number;
      instrument: number;
      fontId: number;
    }) =>
      process.stdin.write(
        `select ${midiChannel} ${fontId} ${bank} ${instrument}\n`
      );

    if (filename === state.loadedFont?.filename) {
      selectInstrument({ bank, instrument, fontId: state.loadedFontCount });
      return resolve({
        loadedFont: entry,
        loadedFontCount: state.loadedFontCount,
      });
    }

    const listener = (data: Buffer) => {
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
        dispatch(lcdController, {
          type: LcdControllerActorMessages.HIDE_TOAST,
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
    dispatch(lcdController, {
      type: LcdControllerActorMessages.SHOW_TOAST,
      id: "LOADING_FONT",
      durationMs: 0,
      text: `Load ${filename}`,
    });
    if (loadedFontCount !== 0) {
      process.stdin.write(`unload ${loadedFontCount}\n`);
    }
    process.stdin.write(`load soundfonts/${escape(filename)}\n`);
    // process.stdin.write("fonts\n");
  });
}

function startSynth(state: FluidSynthState) {
  log(`FluidSynth args: ${fluidsynthArgs}`);
  dispatch(lcdController, {
    type: LcdControllerActorMessages.SHOW_TOAST,
    text: "Starting synth...",
    id: "STARTING_SYNTH",
    durationMs: 500,
  });
  if (state.process) {
    state.process.kill();
  }
  const process = cp.spawn("nice", [
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
        if (os.type() === "Linux") {
          try {
            cp.execSync(`aconnect ${aconnectArgs}`);
          } catch (e) {
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

async function getSynthForFontLoad(state: FluidSynthState) {
  // For some reason, the synth stops working when you load 22 fonts, so
  // we restart it to work around this
  if (state.loadedFontCount < 22) {
    return { process: state.process, loadedFontCount: state.loadedFontCount };
  }
  const { process, ready } = startSynth(state);
  await ready;
  return { process, loadedFontCount: 0 };
}

export const Fluidsynth = (root: ActorSystemRef) =>
  spawn(root, actorFn, Actor.Fluidsynth); //as Ref<FluidSynthMessage>;

export enum FluidSynthMessageType {
  START_SYNTH = "START_SYNTH",
  LOAD_FONT = "LOAD_FONT",
  GET_INSTRUMENTS = "GET_INSTRUMENTS",
}

interface StartSynthMessage {
  type: FluidSynthMessageType.START_SYNTH;
  sender: ActorSystemRef;
}

type GetInstrumentsMessage = {
  type: FluidSynthMessageType.GET_INSTRUMENTS;
  sender: ActorSystemRef;
  font: CollectionItem<SoundFontEntry>;
};

export type LoadFontMessage = {
  type: FluidSynthMessageType.LOAD_FONT;
  sender: Ref<OperationResult>;
  entry: CollectionItem<SoundFontEntry>;
};

type FluidSynthMessage =
  | StartSynthMessage
  | LoadFontMessage
  | GetInstrumentsMessage;

interface FluidSynthState {
  process: cp.ChildProcessWithoutNullStreams;
  loadedFontCount: number;
  loadedFont: SoundFontEntry | undefined;
}
