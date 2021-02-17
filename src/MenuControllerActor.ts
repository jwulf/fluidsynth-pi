import { ActorSystemRef, dispatch, Ref, spawn } from "nact";
import { DialInteractionEventMessage } from "./ActorConstants";

interface MenuControllerActorState {
  activeMenu: ActorSystemRef | undefined;
  menus: { [name: string]: Ref<any> };
}

export enum MenuControllerActorMessages {
  ACTIVATE_MENU = "ACTIVATE_MENU",
  ADD_MENU = "ADD_MENU",
  DIAL_INTERACTION_EVENT = "DIAL_INTERACTION_EVENT",
}

export type ActivateMenuMessage = {
  type: MenuControllerActorMessages.ACTIVATE_MENU;
  menu: any;
  state: any;
};

interface AddMenuMessage {
  type: MenuControllerActorMessages.ADD_MENU;
  menu: Ref<any>;
  name: string;
}

type Message =
  | ActivateMenuMessage
  | AddMenuMessage
  | DialInteractionEventMessage;

export const MenuController = (root: any) =>
  spawn(
    root,
    (
      state: MenuControllerActorState = { activeMenu: undefined, menus: {} },
      msg: Message,
      ctx
    ) => {
      if (msg.type === MenuControllerActorMessages.DIAL_INTERACTION_EVENT) {
        if (state.activeMenu) {
          dispatch(state.activeMenu, msg);
        }
        return state;
      }
      if (msg.type === MenuControllerActorMessages.ADD_MENU) {
        return { ...state, menus: { ...state.menus, [msg.name]: msg.menu } };
      }
      if (msg.type === MenuControllerActorMessages.ACTIVATE_MENU) {
        const activeMenu = state.menus[msg.menu];
        dispatch(activeMenu, {
          type: MenuControllerActorMessages.ACTIVATE_MENU,
          state: msg.state,
        });
        return { ...state, activeMenu };
      }
    }
  );
