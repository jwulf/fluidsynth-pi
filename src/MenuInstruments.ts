import { ActorSystemRef, query, Ref, spawn } from "nact";
import {
  DialInteractionEvent,
  DialInteractionEventMessage,
  DIAL_INTERACTION_EVENT,
  OperationResult,
} from "./ActorConstants";
import { Collection, CollectionItem, Cursor } from "./Collection";
import { fluidSynth, lcdController } from "./main";
import {
  ActivateMenuMessage,
  MenuControllerActorMessages,
} from "./MenuControllerActor";
import { makeDisplayName, moveCursor, updateDisplay } from "./MenuUtils";
import { Favorite } from "./SoundFontLibraryActor";
import path from "path";
import * as fs from "fs";
import { SoundFont2 } from "soundfont2";
import { FluidSynthMessageType } from "./FluidSynthActor";

type InstrumentsState = {
  cursor: Cursor<Favorite>;
  currentlySelected: CollectionItem<Favorite>;
};

type InstrumentMessage = DialInteractionEventMessage | ActivateMenuMessage;

function loadSoundfont(filename: string): Favorite[] {
  const file = path.join(__dirname, "..", "soundfonts", filename);
  const buffer = fs.readFileSync(file);
  try {
    const sf = SoundFont2.from(buffer);
    const presets: Favorite[] = sf.presets.map((p, n) => ({
      filename,
      instrument: p.header.bagIndex,
      bank: p.header.bank,
      displayName: p.header.name,
    }));
    return presets;
  } catch (e) {
    console.log(e.toString());
    return [] as Favorite[];
  }
}
export const InstrumentMenu = async (
  parent: ActorSystemRef,
  filename: string
) => {
  const sf = loadSoundfont(filename);
  const collection = new Collection(sf);
  const cursor = collection.createCursor();

  return spawn(
    parent,
    async (
      state: InstrumentsState = { cursor, currentlySelected: cursor.item! },
      msg: InstrumentMessage,
      ctx
    ) => {
      if (msg.type === MenuControllerActorMessages.ACTIVATE_MENU) {
        const cursor = state.cursor;
        updateDisplay(lcdController, makeDisplayName(false, cursor));
        const entry = cursor.item;
        if (entry !== null) {
          await query(
            fluidSynth,
            (sender: Ref<OperationResult>) => ({
              type: FluidSynthMessageType.LOAD_FONT,
              entry,
              sender,
            }),
            10000
          );
        }
        return { ...state, cursor, currentlySelected: cursor.item };
      }
      if (msg.type === DIAL_INTERACTION_EVENT) {
        if (msg.event_type === DialInteractionEvent.BUTTON_PRESSED) {
          // Allow add to favorites
          // Allow to bail back to instruments
          // Allow bail back to Favorites menu
        } else {
          moveCursor(msg, state);
          if (state.cursor.item?.uuid !== state.currentlySelected.uuid) {
            await query(
              fluidSynth,
              (sender: Ref<OperationResult>) => ({
                type: FluidSynthMessageType.LOAD_FONT,
                entry: state.cursor.item!,
                sender,
              }),
              10000
            );
          }
          return { ...state, currentlySelected: state.cursor.item };
        }
      }
    },
    filename
  );
};
