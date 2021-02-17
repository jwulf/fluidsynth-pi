import { dispatch, Ref } from "nact";
import {
  DialInteractionEvent,
  DialInteractionEventMessage,
} from "./ActorConstants";
import { CollectionItem, Cursor } from "./Collection";
import { LcdControllerActorMessages } from "./LcdControllerActor";
import { lcdController } from "./main";

export function makeDisplayName(
  scrolling: boolean,
  cursor: Cursor<{ displayName: string }>
) {
  return cursor.item === null
    ? "Empty"
    : scrolling
    ? cursor.item?.displayName
    : `:arrowright: ${cursor.item?.displayName?.padEnd(14, " ")}`;
}

export function updateDisplay(lcdController: Ref<any>, text: string) {
  dispatch(lcdController, {
    type: LcdControllerActorMessages.PRINT,
    text,
    line: 0,
  });
  dispatch(lcdController, {
    type: LcdControllerActorMessages.PRINT,
    text: "",
    line: 1,
  });
}

export type MenuState<T extends { displayName: string }> = {
  currentlySelected: CollectionItem<T>;
  cursor: Cursor<T>;
};

export function moveCursor<T extends { displayName: string }>(
  msg: DialInteractionEventMessage,
  state: MenuState<T>
) {
  const previous = state.cursor.item?.uuid;
  msg.event_type === DialInteractionEvent.GO_DOWN
    ? state.cursor.moveBack()
    : state.cursor.moveForward();

  const justChanged = state.cursor.item?.uuid !== previous;
  const scrolling = state.cursor.item?.uuid !== state.currentlySelected?.uuid;
  if (justChanged) {
    dispatch(lcdController, {
      type: LcdControllerActorMessages.PRINT,
      text: makeDisplayName(scrolling, state.cursor),
      line: 0,
    });
  }
  return scrolling;
}
