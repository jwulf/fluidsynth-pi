"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoundFontLibraryMessageTypes = exports.fontExists = exports.SoundFontLibrary = void 0;
const nact_1 = require("nact");
const ActorConstants_1 = require("./ActorConstants");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const Collection_1 = require("./Collection");
const SoundFontLibrary = (root) => nact_1.spawn(root, (state = {}, msg, ctx) => {
    if (!state.files) {
        state.files = new Collection_1.Collection(scanSoundfontsOnDisk());
        state.favorites = new Collection_1.Collection(readFavorites());
    }
    if (msg.type === SoundFontLibraryMessageTypes.SCAN_LIBRARY) {
        state.files = new Collection_1.Collection(scanSoundfontsOnDisk());
        state.favorites = new Collection_1.Collection(readFavorites());
        return state;
    }
    if (msg.type === SoundFontLibraryMessageTypes.ADD_FAVORITE) {
        state.favorites.addItem(msg.favorite);
        writeFavorites(state.favorites);
        return state;
    }
    if (msg.type === SoundFontLibraryMessageTypes.REMOVE_FAVORITE) {
        state.favorites.removeItem(msg.favorite);
        nact_1.dispatch(msg.sender, ActorConstants_1.OPERATION_SUCCESS);
    }
    if (msg.type === SoundFontLibraryMessageTypes.CREATE_FILE_CURSOR) {
        const cursor = state.files.createCursor();
        nact_1.dispatch(msg.sender, cursor);
        return state;
    }
    if (msg.type === SoundFontLibraryMessageTypes.CREATE_FAVORITE_CURSOR) {
        const cursor = state.favorites.createCursor();
        nact_1.dispatch(msg.sender, cursor);
        return state;
    }
    return state;
}, ActorConstants_1.Actor.SoundFontLibrary);
exports.SoundFontLibrary = SoundFontLibrary;
function scanSoundfontsOnDisk() {
    const soundFontFiles = fs_1.default
        .readdirSync(path_1.default.join(__dirname, "..", "soundfonts"))
        .filter((f) => f !== "soundfontLibrary.json")
        .map((f) => ({
        filename: f,
        displayName: f.replace(".sf2", ""),
        instrument: 0,
        bank: 0,
    }));
    return soundFontFiles;
}
function readFavorites() {
    const libFile = getLibraryFilePath();
    const libFileExists = fs_1.default.existsSync(libFile);
    return libFileExists ? require(libFile) : [];
}
function writeFavorites(library) {
    const libFile = getLibraryFilePath();
    fs_1.default.writeFileSync(libFile, JSON.stringify(library.getItems, null, 2));
}
function getLibraryFilePath() {
    return path_1.default.join(__dirname, "..", "soundfonts", "soundfontLibrary.json");
}
function fontExists(filename) {
    const fontFile = path_1.default.join(__dirname, "..", "soundfonts", filename);
    console.log(`Checking for ${fontFile}`);
    return fs_1.default.existsSync(fontFile);
}
exports.fontExists = fontExists;
var SoundFontLibraryMessageTypes;
(function (SoundFontLibraryMessageTypes) {
    SoundFontLibraryMessageTypes["SCAN_LIBRARY"] = "SCAN_LIBRARY";
    SoundFontLibraryMessageTypes["ADD_FAVORITE"] = "ADD_FAVORITE";
    SoundFontLibraryMessageTypes["UPDATE_FAVORITE"] = "UPDATE_FAVORITE";
    SoundFontLibraryMessageTypes["REMOVE_FAVORITE"] = "REMOVE_FAVORITE";
    SoundFontLibraryMessageTypes["CREATE_FILE_CURSOR"] = "CREATE_FILE_CURSOR";
    SoundFontLibraryMessageTypes["CREATE_FAVORITE_CURSOR"] = "CREATE_FAVORITE_CURSOR";
    SoundFontLibraryMessageTypes["UPDATE_LIBRARY"] = "UPDATE_LIBRARY";
})(SoundFontLibraryMessageTypes = exports.SoundFontLibraryMessageTypes || (exports.SoundFontLibraryMessageTypes = {}));
