"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemMenu = void 0;
const nact_1 = require("nact");
const ActorConstants_1 = require("./ActorConstants");
const Collection_1 = require("./Collection");
const main_1 = require("./main");
const MenuControllerActor_1 = require("./MenuControllerActor");
const MenuUtils_1 = require("./MenuUtils");
const child_process_1 = __importDefault(require("child_process"));
const LcdControllerActor_1 = require("./LcdControllerActor");
const menuItems = new Collection_1.Collection([
    { displayName: "Shutdown", intent: "SHUTDOWN" },
    { displayName: "Restart", intent: "RESTART" },
    { displayName: "Return", intent: "EXIT" },
]);
const cursor = menuItems.createCursor();
const SystemMenu = (root) => nact_1.spawn(root, (state = { cursor, currentlySelected: cursor.item }, msg, ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { type } = msg;
    switch (type) {
        case "DIAL_INTERACTION_EVENT": {
            const event = msg.event_type;
            if (event === ActorConstants_1.DialInteractionEvent.BUTTON_PRESSED) {
                // handle button press
                switch ((_a = cursor.item) === null || _a === void 0 ? void 0 : _a.intent) {
                    case "EXIT": {
                        nact_1.dispatch(main_1.menuController, {
                            type: MenuControllerActor_1.MenuControllerActorMessages.ACTIVATE_MENU,
                            menuName: "FAVORITES",
                        });
                        return state;
                    }
                    case "RESTART": {
                        nact_1.dispatch(main_1.lcdController, {
                            type: LcdControllerActor_1.LcdControllerActorMessages.PRINT,
                            text: "Restarting...",
                        });
                        setTimeout(() => child_process_1.default.execSync("init 6"), 800);
                        return state;
                    }
                    case "SHUTDOWN": {
                        nact_1.dispatch(main_1.lcdController, {
                            type: LcdControllerActor_1.LcdControllerActorMessages.PRINT,
                            text: "Good bye!",
                        });
                        setTimeout(() => child_process_1.default.execSync("init 0"), 800);
                        return state;
                    }
                }
                return state;
            }
            MenuUtils_1.moveCursor(msg, state);
            return state;
        }
        case MenuControllerActor_1.MenuControllerActorMessages.ACTIVATE_MENU: {
            MenuUtils_1.updateDisplay(main_1.lcdController, (_b = cursor.item) === null || _b === void 0 ? void 0 : _b.displayName, "System");
            return state;
        }
        default: {
            const e = type;
            throw new Error(`Unhandled case ${e}`);
        }
    }
}), "SYSTEM");
exports.SystemMenu = SystemMenu;
