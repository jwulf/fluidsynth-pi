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
exports.FontExplorerMenu = void 0;
const nact_1 = require("nact");
const ActorConstants_1 = require("./ActorConstants");
const main_1 = require("./main");
const SoundFontLibraryActor_1 = require("./SoundFontLibraryActor");
const MenuControllerActor_1 = require("./MenuControllerActor");
const MenuUtils_1 = require("./MenuUtils");
const MenuInstruments_1 = require("./MenuInstruments");
function getFileCursor() {
    return nact_1.query(main_1.soundFontLibrary, (sender) => ({
        sender,
        type: SoundFontLibraryActor_1.SoundFontLibraryMessageTypes.CREATE_FILE_CURSOR,
    }), 250);
}
const FontExplorerMenu = (parent) => nact_1.spawn(parent, (state = { scrolling: false }, msg, ctx) => __awaiter(void 0, void 0, void 0, function* () {
    if (msg.type === MenuControllerActor_1.MenuControllerActorMessages.ACTIVATE_MENU) {
        const cursor = state.cursor || (yield getFileCursor());
        MenuUtils_1.updateDisplay(main_1.lcdController, MenuUtils_1.makeDisplayName(state.scrolling, cursor), "Soundfonts");
        return Object.assign(Object.assign({}, state), { cursor });
    }
    if (msg.type === ActorConstants_1.DIAL_INTERACTION_EVENT) {
        if (msg.event_type === ActorConstants_1.DialInteractionEvent.BUTTON_PRESSED) {
            const currentFont = state.cursor.item;
            if (currentFont === null) {
                return state;
            }
            // console.log(`dispatching to`, ctx.parent);
            const thisFontsInstrumentMenuFactory = MenuInstruments_1.InstrumentMenu(currentFont);
            nact_1.dispatch(ctx.parent, activateThisMenuMessage(thisFontsInstrumentMenuFactory, currentFont.filename));
            return state;
        }
        else {
            MenuUtils_1.moveCursor(msg, state);
            return state;
        }
    }
    return state;
}), "EXPLORER");
exports.FontExplorerMenu = FontExplorerMenu;
function activateThisMenuMessage(menuFactoryFn, name) {
    return {
        type: MenuControllerActor_1.MenuControllerActorMessages.ACTIVATE_THIS_MENU,
        menuFactoryFn,
        name: `INSTRUMENT-${name}`,
    };
}
