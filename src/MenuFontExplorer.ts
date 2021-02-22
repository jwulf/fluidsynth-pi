import { ActorSystemRef, dispatch, query, Ref, spawn } from "nact";
import {
  DialInteractionEvent,
  DialInteractionEventMessage,
  DIAL_INTERACTION_EVENT,
} from "./ActorConstants";
import { lcdController, soundFontLibrary } from "./main";
import {
  SoundFontEntry,
  SoundFontLibraryMessageTypes,
} from "./SoundFontLibraryActor";
import { CollectionItem, Cursor } from "./Collection";
import {
  ActivateMenuMessage,
  MenuControllerActorMessages,
} from "./MenuControllerActor";
import { makeDisplayName, moveCursor, updateDisplay } from "./MenuUtils";
import { InstrumentMenu } from "./MenuInstruments";
import chalk from "chalk";

type FontExplorerState = {
  cursor: Cursor<SoundFontEntry>;
  currentlySelected: CollectionItem<SoundFontEntry>;
  scrolling: boolean;
};

function getFileCursor() {
  return query(
    soundFontLibrary,
    (sender) => ({
      sender,
      type: SoundFontLibraryMessageTypes.CREATE_FILE_CURSOR,
    }),
    250
  );
}

type FontExplorerMessage = DialInteractionEventMessage | ActivateMenuMessage;

export const FontExplorerMenu = (parent: ActorSystemRef) =>
  spawn(
    parent,
    async (
      state: FontExplorerState = { scrolling: false } as FontExplorerState,
      msg: FontExplorerMessage,
      ctx
    ) => {
      if (msg.type === MenuControllerActorMessages.ACTIVATE_MENU) {
        const cursor = state.cursor || (await getFileCursor());
        updateDisplay(
          lcdController,
          makeDisplayName(state.scrolling, cursor),
          "Soundfonts"
        );
        return { ...state, cursor };
      }
      if (msg.type === DIAL_INTERACTION_EVENT) {
        if (msg.event_type === DialInteractionEvent.BUTTON_PRESSED) {
          const currentFont = state.cursor.item;
          if (currentFont === null) {
            return state;
          }
          console.log(`dispatching to`, ctx.parent);

          const thisFontsInstrumentMenuFactory = InstrumentMenu(currentFont);

          dispatch(
            ctx.parent,
            activateThisMenuMessage(
              thisFontsInstrumentMenuFactory,
              currentFont.filename
            )
          );

          return state;
        } else {
          moveCursor(msg, state);
          return state;
        }
      }
      return state;
    },
    "EXPLORER"
  );

function activateThisMenuMessage(
  menuFactoryFn: (parent: ActorSystemRef, name: string) => Ref<any>,
  name: string
) {
  return {
    type: MenuControllerActorMessages.ACTIVATE_THIS_MENU,
    menuFactoryFn,
    name: `INSTRUMENT-${name}`,
  };
}
