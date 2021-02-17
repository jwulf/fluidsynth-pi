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
const FontExplorerMenu = (root) => nact_1.spawn(root, (state = { scrolling: false }, msg, ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (msg.type === MenuControllerActor_1.MenuControllerActorMessages.ACTIVATE_MENU) {
        const cursor = state.cursor || (yield getFileCursor());
        MenuUtils_1.updateDisplay(main_1.lcdController, MenuUtils_1.makeDisplayName(state.scrolling, cursor));
        return Object.assign(Object.assign({}, state), { cursor });
    }
    if (msg.type === ActorConstants_1.DIAL_INTERACTION_EVENT) {
        if (msg.event_type === ActorConstants_1.DialInteractionEvent.BUTTON_PRESSED) {
            const currentFont = (_a = state.cursor.item) === null || _a === void 0 ? void 0 : _a.filename;
            let instruments = currentFont !== undefined && ctx.children.has(currentFont)
                ? ctx.children.get(currentFont)
                : yield MenuInstruments_1.InstrumentMenu(main_1.fontExplorerMenu, currentFont);
            nact_1.dispatch(main_1.menuController, {
                type: MenuControllerActor_1.MenuControllerActorMessages.ACTIVATE_MENU,
                state: { font: state.cursor.item },
                menu: instruments,
            });
        }
        else {
            return Object.assign(Object.assign({}, state), { scrolling: MenuUtils_1.moveCursor(msg, state) });
        }
    }
}), "FontExplorer");
exports.FontExplorerMenu = FontExplorerMenu;
