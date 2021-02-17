import { ActorSystemRef, dispatch, query, Ref, spawn } from "nact";
import {
  DialInteractionEvent,
  DialInteractionEventMessage,
  DIAL_INTERACTION_EVENT,
} from "./ActorConstants";
import {
  fontExplorerMenu,
  lcdController,
  menuController,
  soundFontLibrary,
} from "./main";
import {
  Favorite,
  SoundFontFile,
  SoundFontLibraryMessageTypes,
} from "./SoundFontLibraryActor";
import { Collection, CollectionItem, Cursor } from "./Collection";
import {
  ActivateMenuMessage,
  MenuControllerActorMessages,
} from "./MenuControllerActor";
import { makeDisplayName, moveCursor, updateDisplay } from "./MenuUtils";
import { InstrumentMenu } from "./MenuInstruments";

type FavoritesMessage = DialInteractionEventMessage | ActivateMenuMessage;

type FontExplorerState = {
  cursor: Cursor<SoundFontFile>;
  currentlySelected: CollectionItem<SoundFontFile>;
  scrolling: boolean;
  instrumentM: { [key: string]: Collection<Favorite> };
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

export const FontExplorerMenu = (root: ActorSystemRef) =>
  spawn(
    root,
    async (
      state: FontExplorerState = { scrolling: false } as FontExplorerState,
      msg: FontExplorerMessage,
      ctx
    ) => {
      if (msg.type === MenuControllerActorMessages.ACTIVATE_MENU) {
        const cursor = state.cursor || (await getFileCursor());
        updateDisplay(lcdController, makeDisplayName(state.scrolling, cursor));
        return { ...state, cursor };
      }
      if (msg.type === DIAL_INTERACTION_EVENT) {
        if (msg.event_type === DialInteractionEvent.BUTTON_PRESSED) {
          const currentFont = state.cursor.item?.filename;
          let instruments =
            currentFont !== undefined && ctx.children.has(currentFont)
              ? ctx.children.get(currentFont)
              : await InstrumentMenu(fontExplorerMenu, currentFont!);
          dispatch(menuController, {
            type: MenuControllerActorMessages.ACTIVATE_MENU,
            state: { font: state.cursor.item },
            menu: instruments,
          });
        } else {
          return { ...state, scrolling: moveCursor(msg, state) };
        }
      }
    },
    "FontExplorer"
  );
