import { ActorSystemRef, dispatch, Ref, spawn } from "nact";
import {
  Actor,
  DialInteractionEvent,
  DialInteractionEventMessage,
} from "./ActorConstants";
import { FavoriteMenu } from "./MenuFavorites";
import { FontExplorerMenu } from "./MenuFontExplorer";
import { Log } from "./ringlog";

type MenuList = "FAVORITES" | "EXPLORER" | "SYSTEM";

const log = Log();

interface MenuControllerActorState {
  activeMenu: ActorSystemRef | undefined;
  previousMenus: ActorSystemRef[];
}

export enum MenuControllerActorMessages {
  ACTIVATE_MENU = "ACTIVATE_MENU",
  ACTIVATE_THIS_MENU = "ACTIVATE_THIS_MENU",
  ADD_MENU = "ADD_MENU",
  DIAL_INTERACTION_EVENT = "DIAL_INTERACTION_EVENT",
}

export type ActivateMenuMessage = {
  type: MenuControllerActorMessages.ACTIVATE_MENU;
  menuName: MenuList;
  menuState?: any;
};

export type ActivateThisMenuMessage = {
  type: MenuControllerActorMessages.ACTIVATE_THIS_MENU;
  menuFactoryFn: (parent: Ref<any>, name: string) => Ref<any>;
  menuName: string;
  menuState?: any;
};

interface AddMenuMessage {
  type: MenuControllerActorMessages.ADD_MENU;
  menu: Ref<any>;
  name: string;
}

type Message =
  | ActivateMenuMessage
  | ActivateThisMenuMessage
  | AddMenuMessage
  | DialInteractionEventMessage;

export const MenuController = (parent: any): Ref<Message> => {
  const menuController = spawn(
    parent,
    (
      state: MenuControllerActorState = {
        activeMenu: undefined,
        previousMenus: [],
      } as MenuControllerActorState,
      msg: Message,
      ctx
    ) => {
      const activateMenu = (
        msg: ActivateMenuMessage | ActivateThisMenuMessage,
        activeMenu: Ref<any>
      ) => {
        log(`Activating menu ${msg.menuName}`);
        dispatch(activeMenu, {
          type: MenuControllerActorMessages.ACTIVATE_MENU,
          menuState: msg.menuState,
        });
      };

      if (msg.type === MenuControllerActorMessages.DIAL_INTERACTION_EVENT) {
        if (msg.event_type === DialInteractionEvent.BUTTON_LONG_PRESS) {
          const nextMenu = state.previousMenus.pop();
          if (nextMenu) {
            dispatch(nextMenu, {
              type: MenuControllerActorMessages.ACTIVATE_MENU,
            });
            const activeMenu = nextMenu;
            return { ...state, activeMenu };
          }
        } else if (state.activeMenu) {
          // delegate dial handler to active menu
          dispatch(state.activeMenu, msg);
        }
        return state;
      }

      if (msg.type === MenuControllerActorMessages.ACTIVATE_MENU) {
        const activeMenu = ctx.children.get(msg.menuName)!;
        if (msg.menuName === "FAVORITES") {
          state.previousMenus = [ctx.children.get("SYSTEM")!];
        } else {
          const previousMenu = state.activeMenu;
          if (previousMenu !== undefined) {
            state.previousMenus.push(previousMenu);
          }
        }
        activateMenu(msg, activeMenu);
        return { ...state, activeMenu };
      }

      if (msg.type === MenuControllerActorMessages.ACTIVATE_THIS_MENU) {
        const { menuFactoryFn, menuName: name } = msg;
        const previousMenu = state.activeMenu;
        if (previousMenu !== undefined) {
          state.previousMenus.push(previousMenu);
        }
        const activeMenu = ctx.children.has(name)
          ? ctx.children.get(name)
          : menuFactoryFn(ctx.self, name);
        activateMenu(msg, activeMenu!);
        return { ...state, activeMenu };
      }
    },
    Actor.MenuController
  );
  FavoriteMenu(menuController);
  FontExplorerMenu(menuController);
  return menuController;
};
