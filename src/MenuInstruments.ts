import { ActorSystemRef, dispatch, query, Ref, spawn } from "nact";
import {
  DialInteractionEvent,
  DialInteractionEventMessage,
  DIAL_INTERACTION_EVENT,
  OperationResult,
} from "./ActorConstants";
import { Collection, CollectionItem, Cursor } from "./Collection";
import { fluidSynth, lcdController, menuController } from "./main";
import {
  ActivateMenuMessage,
  MenuControllerActorMessages,
} from "./MenuControllerActor";
import { makeDisplayName, moveCursor, updateDisplay } from "./MenuUtils";
import { SoundFontEntry } from "./SoundFontLibraryActor";
import { FluidSynthMessageType } from "./FluidSynthActor";

type InstrumentsState = {
  cursor: Cursor<SoundFontEntry>;
  currentlySelected: CollectionItem<SoundFontEntry> | null;
};

type InstrumentMessage = DialInteractionEventMessage | ActivateMenuMessage;

export const InstrumentMenu = (font: CollectionItem<SoundFontEntry>) => (
  parent: ActorSystemRef,
  name: string
) => {
  // tslint:disable-next-line: no-console
  console.log("Creating Instrument Menu Factory function for ", font.filename); // @DEBUG
  let isloadingFont = false;
  return spawn(
    parent,
    async (
      state: InstrumentsState = {} as InstrumentsState,
      msg: InstrumentMessage,
      ctx
    ) => {
      const { type } = msg;
      switch (msg.type) {
        case MenuControllerActorMessages.ACTIVATE_MENU: {
          if (!state.cursor) {
            isloadingFont = true;

            const sf: SoundFontEntry[] = await query(
              fluidSynth,
              (sender) => ({
                sender,
                type: FluidSynthMessageType.GET_INSTRUMENTS,
                font,
              }),
              30000
            ); //loadSoundfont(filename);
            console.log("sf", sf);
            const collection = new Collection(sf);
            state.cursor = collection.createCursor();
            state.currentlySelected = state.cursor.item!;

            isloadingFont = false;
          }
          const cursor = state.cursor;
          updateDisplay(
            lcdController,
            makeDisplayName(false, cursor),
            `${font.filename}`
          );
          const entry = cursor.item;
          if (entry !== null) {
            await query(
              fluidSynth,
              (sender: Ref<OperationResult>) => ({
                type: FluidSynthMessageType.LOAD_FONT,
                entry,
                sender,
              }),
              20000
            );
          }
          return { ...state, cursor, currentlySelected: cursor.item };
        }
        case DIAL_INTERACTION_EVENT: {
          if (isloadingFont) {
            return state;
          }
          switch (msg.event_type) {
            case DialInteractionEvent.BUTTON_PRESSED: {
              // Allow add to favorites
              // Allow to bail back to instruments
              // Allow bail back to Favorites menu
              return state;
            }
            case DialInteractionEvent.BUTTON_LONG_PRESS: {
              dispatch(menuController, {
                type: MenuControllerActorMessages.ACTIVATE_MENU,
                menuName: "EXPLORER",
              });
              return state;
            }
            case DialInteractionEvent.GO_DOWN:
            case DialInteractionEvent.GO_UP: {
              moveCursor(msg, state);
              if (state.cursor.item?.uuid !== state.currentlySelected?.uuid) {
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
            default: {
              const exhaustiveCheck: never = msg.event_type;
              throw new Error(`Unhandled: ${exhaustiveCheck}`);
            }
          }
        }
      }
    },
    name
  );
};
