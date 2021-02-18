"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.InstrumentMenu = void 0;
const nact_1 = require("nact");
const ActorConstants_1 = require("./ActorConstants");
const Collection_1 = require("./Collection");
const main_1 = require("./main");
const MenuControllerActor_1 = require("./MenuControllerActor");
const MenuUtils_1 = require("./MenuUtils");
const path_1 = __importDefault(require("path"));
const fs = __importStar(require("fs"));
const soundfont2_1 = require("soundfont2");
const FluidSynthActor_1 = require("./FluidSynthActor");
function loadSoundfont(filename) {
    const file = path_1.default.join(__dirname, "..", "soundfonts", filename);
    const buffer = fs.readFileSync(file);
    try {
        const sf = soundfont2_1.SoundFont2.from(buffer);
        const presets = sf.presets.map((p, n) => ({
            filename,
            instrument: p.header.bagIndex,
            bank: p.header.bank,
            displayName: p.header.name,
        }));
        return presets;
    }
    catch (e) {
        console.log(e.toString());
        return [];
    }
}
const InstrumentMenu = (filename) => (parent, name) => __awaiter(void 0, void 0, void 0, function* () {
    const sf = loadSoundfont(filename);
    const collection = new Collection_1.Collection(sf);
    const cursor = collection.createCursor();
    return nact_1.spawn(parent, (state = { cursor, currentlySelected: cursor.item }, msg, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        if (msg.type === MenuControllerActor_1.MenuControllerActorMessages.ACTIVATE_MENU) {
            const cursor = state.cursor;
            MenuUtils_1.updateDisplay(main_1.lcdController, MenuUtils_1.makeDisplayName(false, cursor));
            const entry = cursor.item;
            if (entry !== null) {
                yield nact_1.query(main_1.fluidSynth, (sender) => ({
                    type: FluidSynthActor_1.FluidSynthMessageType.LOAD_FONT,
                    entry,
                    sender,
                }), 10000);
            }
            return Object.assign(Object.assign({}, state), { cursor, currentlySelected: cursor.item });
        }
        if (msg.type === ActorConstants_1.DIAL_INTERACTION_EVENT) {
            if (msg.event_type === ActorConstants_1.DialInteractionEvent.BUTTON_PRESSED) {
                // Allow add to favorites
                // Allow to bail back to instruments
                // Allow bail back to Favorites menu
            }
            else {
                MenuUtils_1.moveCursor(msg, state);
                if (((_a = state.cursor.item) === null || _a === void 0 ? void 0 : _a.uuid) !== state.currentlySelected.uuid) {
                    yield nact_1.query(main_1.fluidSynth, (sender) => ({
                        type: FluidSynthActor_1.FluidSynthMessageType.LOAD_FONT,
                        entry: state.cursor.item,
                        sender,
                    }), 10000);
                }
                return Object.assign(Object.assign({}, state), { currentlySelected: state.cursor.item });
            }
        }
    }), name);
});
exports.InstrumentMenu = InstrumentMenu;
