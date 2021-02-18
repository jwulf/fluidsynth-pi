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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FavoriteMenu = void 0;
const nact_1 = require("nact");
const ActorConstants_1 = require("./ActorConstants");
const main_1 = require("./main");
const SoundFontLibraryActor_1 = require("./SoundFontLibraryActor");
const LcdControllerActor_1 = require("./LcdControllerActor");
const FluidSynthActor_1 = require("./FluidSynthActor");
const MenuControllerActor_1 = require("./MenuControllerActor");
const MenuUtils_1 = require("./MenuUtils");
function getFavoritesCursor() {
    return nact_1.query(main_1.soundFontLibrary, (sender) => ({
        sender,
        type: SoundFontLibraryActor_1.SoundFontLibraryMessageTypes.CREATE_FAVORITE_CURSOR,
    }), 250);
}
function loadFont(entry) {
    return nact_1.query(main_1.fluidSynth, (sender) => ({
        sender,
        type: FluidSynthActor_1.FluidSynthMessageType.LOAD_FONT,
        entry,
    }), 10000);
}
const FavoriteMenu = (root) => nact_1.spawn(root, (state = { scrolling: false }, msg, ctx) => __awaiter(void 0, void 0, void 0, function* () {
    state.cursor = state.cursor || (yield getFavoritesCursor());
    if (msg.type === MenuControllerActor_1.MenuControllerActorMessages.ACTIVATE_MENU) {
        MenuUtils_1.updateDisplay(main_1.lcdController, MenuUtils_1.makeDisplayName(state.scrolling, state.cursor));
        return Object.assign({}, state);
    }
    if (msg.type === ActorConstants_1.DIAL_INTERACTION_EVENT) {
        if (msg.event_type === ActorConstants_1.DialInteractionEvent.BUTTON_PRESSED) {
            if (state.scrolling) {
                // Button pressed on an item that isn't selected
                if (state.cursor.item === null) {
                    return state;
                }
                const fontLoadResult = yield loadFont(state.cursor.item);
                if (fontLoadResult.result === ActorConstants_1.OPERATION_SUCCESS) {
                    return Object.assign(Object.assign({}, state), { scrolling: false, currentlySelected: state.cursor.item });
                }
                else {
                    nact_1.dispatch(main_1.lcdController, {
                        type: LcdControllerActor_1.LcdControllerActorMessages.SHOW_TOAST,
                        text: "Error",
                        durationMs: 2000,
                        id: "FAVORITE_LOAD_FAILURE",
                    });
                    return state;
                }
            }
            else {
                // Button pressed, not scrolling - invoke further menu
                nact_1.dispatch(main_1.menuController, {
                    type: MenuControllerActor_1.MenuControllerActorMessages.ACTIVATE_MENU,
                    menuName: "EXPLORER",
                    state: {},
                });
                return state;
            }
        }
        else {
            // Move up or down
            return Object.assign(Object.assign({}, state), { scrolling: MenuUtils_1.moveCursor(msg, state) });
        }
    }
}), "FAVORITES");
exports.FavoriteMenu = FavoriteMenu;
