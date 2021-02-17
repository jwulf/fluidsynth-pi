import chalk from "chalk";
import { dispatch, Ref, spawn } from "nact";
import { Actor } from "./ActorConstants";
import { LCD } from "./lcd";
import { LcdToastRemover, LcdToasterMessage } from "./LcdToastActor";
import { Log } from "./ringlog";

/**
 * Note: there is an edge case: if you show a toast with a duration, then
 * show a toast with the same id, then the first duration will cancel the second toast.
 */

const log = Log(chalk.yellowBright);

const lcdEnabled = (process.env.ENABLE_LCD || "false").toLowerCase() === "true";
const lcd = lcdEnabled ? new LCD() : null;

log(`LCD ${lcdEnabled ? "enabled" : "disabled"}`);

const lcdPrint = (msg: string, line: number) => {
  if (lcd) {
    return lcd.print((msg || "").replace(".sf2", "").padEnd(16, " "), line);
  } else {
    console.log(`Line ${line}: ${msg}`);
  }
};

export const LcdController = (root: any) => {
  const actor = spawn(
    root,
    (
      state: LcdControllerActorState = { activeToastId: undefined },
      msg: Message,
      ctx
    ) => {
      if (msg.type === LcdControllerActorMessages.PRINT) {
        const { text, line = 0 } = msg;
        lcdPrint(text, line);
        return;
      }
      if (msg.type === LcdControllerActorMessages.SHOW_TOAST) {
        const { durationMs, id, text } = msg;
        lcdPrint(text, 1);
        if (durationMs !== 0) {
          dispatch<LcdToasterMessage>(toastRemover, {
            type: "SHOW",
            id,
            durationMs,
          });
        }
        return {
          ...state,
          activeToast: id,
        };
      }
      if (msg.type === LcdControllerActorMessages.HIDE_TOAST) {
        const { id } = msg;
        const isToastActive = state.activeToastId === id;
        if (!isToastActive) {
          return state;
        } else {
          lcdPrint("", 1);
          return {
            ...state,
            activeToast: undefined,
          };
        }
      }
    },
    Actor.LcdController
  );
  const toastRemover = LcdToastRemover(actor);
  return actor as Ref<Message>;
};

interface LcdControllerActorState {
  activeToastId: string | undefined;
}

export enum LcdControllerActorMessages {
  PRINT = "PRINT",
  SHOW_TOAST = "SHOW_TOAST",
  HIDE_TOAST = "HIDE_TOAST",
}

interface PrintMessage {
  type: LcdControllerActorMessages.PRINT;
  text: string;
  line?: number;
}

interface ShowToastMessage {
  type: LcdControllerActorMessages.SHOW_TOAST;
  id: string;
  text: string;
  durationMs: number;
}

export interface HideToastMessage {
  type: LcdControllerActorMessages.HIDE_TOAST;
  id: string;
}

type Message = PrintMessage | ShowToastMessage | HideToastMessage;
