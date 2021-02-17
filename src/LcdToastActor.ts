import { dispatch, spawn, spawnStateless } from "nact";
import { Actor } from "./ActorConstants";
import {
  HideToastMessage,
  LcdControllerActorMessages,
} from "./LcdControllerActor";

export interface LcdToasterMessage {
  type: "SHOW";
  id: string;
  durationMs: number;
}

export const LcdToastRemover = (root: any) =>
  spawnStateless(root, (msg: LcdToasterMessage, ctx) => {
    if (msg.type === "SHOW") {
      const { id, durationMs } = msg;
      setTimeout(
        () =>
          dispatch<HideToastMessage>(root, {
            type: LcdControllerActorMessages.HIDE_TOAST,
            id,
          }),
        durationMs
      );
    }
  });
