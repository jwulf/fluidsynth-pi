import { ActorSystemRef, dispatch, spawn } from "nact";
import {
  DialInteractionEvent,
  DialInteractionEventMessage,
} from "./ActorConstants";
import { Collection, CollectionItem, Cursor } from "./Collection";
import { lcdController, menuController } from "./main";
import {
  ActivateMenuMessage,
  MenuControllerActorMessages,
} from "./MenuControllerActor";
import { MenuItem, MenuState, moveCursor, updateDisplay } from "./MenuUtils";
import cp from "child_process";
import { LcdControllerActorMessages } from "./LcdControllerActor";

interface SystemMenuItem extends MenuItem {
  intent: "SHUTDOWN" | "RESTART" | "EXIT";
}

const menuItems = new Collection([
  { displayName: "Shutdown", intent: "SHUTDOWN" as const },
  { displayName: "Restart", intent: "RESTART" as const },
  { displayName: "Return", intent: "EXIT" as const },
]);
const cursor = menuItems.createCursor();

type SystemMenuMessage = ActivateMenuMessage | DialInteractionEventMessage;

interface SystemMenuState extends MenuState<SystemMenuItem> {}

export const SystemMenu = (root: ActorSystemRef) =>
  spawn(
    root,
    async (
      state: SystemMenuState = { cursor, currentlySelected: cursor.item },
      msg: SystemMenuMessage,
      ctx
    ) => {
      const { type } = msg;
      switch (type) {
        case "DIAL_INTERACTION_EVENT": {
          const event = (msg as DialInteractionEventMessage).event_type;
          if (event === DialInteractionEvent.BUTTON_PRESSED) {
            // handle button press
            switch (cursor.item?.intent) {
              case "EXIT": {
                dispatch(menuController, {
                  type: MenuControllerActorMessages.ACTIVATE_MENU,
                  menuName: "FAVORITES",
                });
                return state;
              }
              case "RESTART": {
                dispatch(lcdController, {
                  type: LcdControllerActorMessages.PRINT,
                  text: "Restarting...",
                });
                setTimeout(() => cp.execSync("init 6"), 800);
                return state;
              }
              case "SHUTDOWN": {
                dispatch(lcdController, {
                  type: LcdControllerActorMessages.PRINT,
                  text: "Good bye!",
                });
                setTimeout(() => cp.execSync("init 0"), 800);
                return state;
              }
            }
            return state;
          }
          moveCursor(msg as DialInteractionEventMessage, state);
          return state;
        }
        case MenuControllerActorMessages.ACTIVATE_MENU: {
          updateDisplay(lcdController, cursor.item?.displayName!, "System");
          return state;
        }
        default: {
          const e: never = type;
          throw new Error(`Unhandled case ${e}`);
        }
      }
    },
    "SYSTEM"
  );
