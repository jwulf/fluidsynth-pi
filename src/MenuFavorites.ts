import { ActorSystemRef, dispatch, query, Ref, spawn } from "nact";
import {
  Actor,
  DialInteractionEvent,
  DialInteractionEventMessage,
  DIAL_INTERACTION_EVENT,
  OperationResult,
  OPERATION_SUCCESS,
} from "./ActorConstants";
import { fluidSynth, lcdController, soundFontLibrary } from "./main";
import {
  SoundFontEntry,
  SoundFontLibraryMessageTypes,
} from "./SoundFontLibraryActor";
import { LcdControllerActorMessages } from "./LcdControllerActor";
import { FluidSynthMessageType } from "./FluidSynthActor";
import { CollectionItem, Cursor } from "./Collection";
import {
  MenuControllerActorMessages,
  ActivateMenuMessage,
} from "./MenuControllerActor";
import {
  makeDisplayName,
  MenuState,
  moveCursor,
  updateDisplay,
} from "./MenuUtils";

interface FavoritesState extends MenuState<SoundFontEntry> {
  cursor: Cursor<SoundFontEntry>;
  scrolling: boolean;
  currentlySelected: CollectionItem<SoundFontEntry> | null;
}

type FavoritesMessage = DialInteractionEventMessage | ActivateMenuMessage;

function getFavoritesCursor() {
  return query(
    soundFontLibrary,
    (sender: Ref<Cursor<SoundFontEntry>>) => ({
      sender,
      type: SoundFontLibraryMessageTypes.CREATE_FAVORITE_CURSOR,
    }),
    250
  );
}

function loadFont<T>(entry: CollectionItem<SoundFontEntry>) {
  return query(
    fluidSynth,
    (sender: Ref<OperationResult>) => ({
      sender,
      type: FluidSynthMessageType.LOAD_FONT,
      entry,
    }),
    10000
  );
}

export const FavoriteMenu = (root: ActorSystemRef) =>
  spawn(
    root,
    async (
      state: FavoritesState = {
        scrolling: false,
        currentlySelected: null,
      } as FavoritesState,
      msg: FavoritesMessage,
      ctx
    ) => {
      state.cursor = state.cursor || (await getFavoritesCursor());
      if (msg.type === MenuControllerActorMessages.ACTIVATE_MENU) {
        updateDisplay(
          lcdController,
          makeDisplayName(state.scrolling, state.cursor),
          "Favorites"
        );
        return { ...state };
      }
      if (msg.type === DIAL_INTERACTION_EVENT) {
        if (msg.event_type === DialInteractionEvent.BUTTON_PRESSED) {
          if (state.scrolling) {
            // Button pressed on an item that isn't selected
            if (state.cursor.item === null) {
              return state;
            }
            const fontLoadResult = await loadFont(state.cursor.item);
            if (fontLoadResult.result === OPERATION_SUCCESS) {
              return {
                ...state,
                scrolling: false,
                currentlySelected: state.cursor.item,
              };
            } else {
              dispatch(lcdController, {
                type: LcdControllerActorMessages.SHOW_TOAST,
                text: "Error",
                durationMs: 2000,
                id: "FAVORITE_LOAD_FAILURE",
              });
              return state;
            }
          } else {
            // Button pressed, not scrolling - invoke further menu
            dispatch(ctx.parent, {
              type: MenuControllerActorMessages.ACTIVATE_MENU,
              menuName: "EXPLORER",
            });
            return state;
          }
        } else {
          // Move up or down
          return { ...state, scrolling: moveCursor(msg, state) };
        }
      }
    },
    "FAVORITES"
  );
