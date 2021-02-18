import { ActorSystemRef, dispatch, Ref, spawn } from "nact";
import { DialInteractionEventMessage } from "./ActorConstants";
import { FavoriteMenu } from "./MenuFavorites";
import { FontExplorerMenu } from "./MenuFontExplorer";

type MenuList = "FAVORITES" | "EXPLORER";

interface MenuControllerActorState {
  activeMenu: ActorSystemRef | undefined;
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
  state?: any;
};

export type ActiveThisMenuMessage = {
  type: MenuControllerActorMessages.ACTIVATE_THIS_MENU;
  menu: (parent: Ref<any>, name: string) => Ref<any>;
  name: string;
  state?: any;
};

interface AddMenuMessage {
  type: MenuControllerActorMessages.ADD_MENU;
  menu: Ref<any>;
  name: string;
}

type Message =
  | ActivateMenuMessage
  | ActiveThisMenuMessage
  | AddMenuMessage
  | DialInteractionEventMessage;

export const MenuController = (root: any): Ref<Message> => {
  const menuController = spawn(
    root,
    (
      state: MenuControllerActorState = {
        activeMenu: undefined,
      } as MenuControllerActorState,
      msg: Message,
      ctx
    ) => {
      if (msg.type === MenuControllerActorMessages.DIAL_INTERACTION_EVENT) {
        if (state.activeMenu) {
          dispatch(state.activeMenu, msg);
        }
        return state;
      }
      if (msg.type === MenuControllerActorMessages.ACTIVATE_MENU) {
        const activeMenu = ctx.children.get(msg.menuName)!;
        dispatch(activeMenu, {
          type: MenuControllerActorMessages.ACTIVATE_MENU,
          state: msg.state,
        });
        return { ...state, activeMenu };
      }
      if (msg.type === MenuControllerActorMessages.ACTIVATE_THIS_MENU) {
        const { menu, name, state } = msg;
        const activeMenu = ctx.children.has(name)
          ? ctx.children.get(name)
          : menu(ctx.self, name);
        dispatch(activeMenu!, {
          type: MenuControllerActorMessages.ACTIVATE_MENU,
          state,
        });
        return { ...state, activeMenu };
      }
    }
  );
  FavoriteMenu(menuController);
  FontExplorerMenu(menuController);
  return menuController;
};
