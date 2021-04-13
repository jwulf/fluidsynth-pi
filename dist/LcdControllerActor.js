"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LcdControllerActorMessages = exports.LcdController = void 0;
const chalk_1 = __importDefault(require("chalk"));
const nact_1 = require("nact");
const ActorConstants_1 = require("./ActorConstants");
const lcd_1 = require("./lcd");
const lcd2_1 = require("./lcd2");
const LcdToastActor_1 = require("./LcdToastActor");
const ringlog_1 = require("./ringlog");
const version_1 = require("./version");
/**
 * Note: there is an edge case: if you show a toast with a duration, then
 * show a toast with the same id, then the first duration will cancel the second toast.
 */
const log = ringlog_1.Log(chalk_1.default.yellowBright);
const lcd = version_1.synthVersion === "1" ? new lcd_1.LCD() : new lcd2_1.LCD2();
const lcdPrint = (msg, line) => {
    if (lcd) {
        return lcd.print((msg || "").replace(".sf2", "").padEnd(16, " "), line);
    }
    else {
        console.log(`Line ${line}: ${msg}`);
    }
};
const LcdController = (root) => {
    const actor = nact_1.spawn(root, (state = { activeToastId: undefined }, msg, ctx) => {
        if (msg.type === LcdControllerActorMessages.PRINT) {
            const { text, line = 0 } = msg;
            lcdPrint(text, line);
            return;
        }
        if (msg.type === LcdControllerActorMessages.SHOW_TOAST) {
            const { durationMs, id, text } = msg;
            lcdPrint(text, 1);
            if (durationMs !== 0) {
                nact_1.dispatch(toastRemover, {
                    type: "SHOW",
                    id,
                    durationMs,
                });
            }
            return Object.assign(Object.assign({}, state), { activeToast: id });
        }
        if (msg.type === LcdControllerActorMessages.HIDE_TOAST) {
            const { id } = msg;
            const isToastActive = state.activeToastId === id;
            if (!isToastActive) {
                return state;
            }
            else {
                lcdPrint("", 1);
                return Object.assign(Object.assign({}, state), { activeToast: undefined });
            }
        }
    }, ActorConstants_1.Actor.LcdController);
    const toastRemover = LcdToastActor_1.LcdToastRemover(actor);
    return actor;
};
exports.LcdController = LcdController;
var LcdControllerActorMessages;
(function (LcdControllerActorMessages) {
    LcdControllerActorMessages["PRINT"] = "PRINT";
    LcdControllerActorMessages["SHOW_TOAST"] = "SHOW_TOAST";
    LcdControllerActorMessages["HIDE_TOAST"] = "HIDE_TOAST";
})(LcdControllerActorMessages = exports.LcdControllerActorMessages || (exports.LcdControllerActorMessages = {}));
