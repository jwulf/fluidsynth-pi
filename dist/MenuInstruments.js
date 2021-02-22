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
exports.InstrumentMenu = void 0;
const nact_1 = require("nact");
const ActorConstants_1 = require("./ActorConstants");
const Collection_1 = require("./Collection");
const main_1 = require("./main");
const MenuControllerActor_1 = require("./MenuControllerActor");
const MenuUtils_1 = require("./MenuUtils");
const FluidSynthActor_1 = require("./FluidSynthActor");
const InstrumentMenu = (font) => (parent, name) => {
    // tslint:disable-next-line: no-console
    console.log("Creating Instrument Menu Factory function for ", font.filename); // @DEBUG
    let isloadingFont = false;
    return nact_1.spawn(parent, (state = {}, msg, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const { type } = msg;
        switch (msg.type) {
            case MenuControllerActor_1.MenuControllerActorMessages.ACTIVATE_MENU: {
                if (!state.cursor) {
                    isloadingFont = true;
                    const sf = yield nact_1.query(main_1.fluidSynth, (sender) => ({
                        sender,
                        type: FluidSynthActor_1.FluidSynthMessageType.GET_INSTRUMENTS,
                        font,
                    }), 30000); //loadSoundfont(filename);
                    console.log("sf", sf);
                    const collection = new Collection_1.Collection(sf);
                    state.cursor = collection.createCursor();
                    state.currentlySelected = state.cursor.item;
                    isloadingFont = false;
                }
                const cursor = state.cursor;
                MenuUtils_1.updateDisplay(main_1.lcdController, MenuUtils_1.makeDisplayName(false, cursor), `${font.filename}`);
                const entry = cursor.item;
                if (entry !== null) {
                    yield nact_1.query(main_1.fluidSynth, (sender) => ({
                        type: FluidSynthActor_1.FluidSynthMessageType.LOAD_FONT,
                        entry,
                        sender,
                    }), 20000);
                }
                return Object.assign(Object.assign({}, state), { cursor, currentlySelected: cursor.item });
            }
            case ActorConstants_1.DIAL_INTERACTION_EVENT: {
                if (isloadingFont) {
                    return state;
                }
                switch (msg.event_type) {
                    case ActorConstants_1.DialInteractionEvent.BUTTON_PRESSED: {
                        // Allow add to favorites
                        // Allow to bail back to instruments
                        // Allow bail back to Favorites menu
                        return state;
                    }
                    case ActorConstants_1.DialInteractionEvent.BUTTON_LONG_PRESS: {
                        nact_1.dispatch(main_1.menuController, {
                            type: MenuControllerActor_1.MenuControllerActorMessages.ACTIVATE_MENU,
                            menuName: "EXPLORER",
                        });
                        return state;
                    }
                    case ActorConstants_1.DialInteractionEvent.GO_DOWN:
                    case ActorConstants_1.DialInteractionEvent.GO_UP: {
                        MenuUtils_1.moveCursor(msg, state);
                        if (((_a = state.cursor.item) === null || _a === void 0 ? void 0 : _a.uuid) !== ((_b = state.currentlySelected) === null || _b === void 0 ? void 0 : _b.uuid)) {
                            yield nact_1.query(main_1.fluidSynth, (sender) => ({
                                type: FluidSynthActor_1.FluidSynthMessageType.LOAD_FONT,
                                entry: state.cursor.item,
                                sender,
                            }), 10000);
                        }
                        return Object.assign(Object.assign({}, state), { currentlySelected: state.cursor.item });
                    }
                    default: {
                        const exhaustiveCheck = msg.event_type;
                        throw new Error(`Unhandled: ${exhaustiveCheck}`);
                    }
                }
            }
        }
    }), name);
};
exports.InstrumentMenu = InstrumentMenu;
