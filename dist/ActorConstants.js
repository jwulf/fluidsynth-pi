"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPERATION_FAILED = exports.OPERATION_SUCCESS = exports.DIAL_INTERACTION_EVENT = exports.DialInteractionEvent = exports.Actor = void 0;
var Actor;
(function (Actor) {
    Actor["LcdController"] = "LcdController";
    Actor["LcdToaster"] = "LcdToaster";
    Actor["MenuController"] = "MenuController";
    Actor["SoundFontLibrary"] = "SoundFontLibrary";
    Actor["SoundFontLibraryCursor"] = "SoundFontLibraryCursor";
    Actor["Fluidsynth"] = "Fluidsynth";
    Actor["MenuFavorites"] = "MenuFavorites";
    Actor["InstrumentContext"] = "InstrumentContext";
})(Actor = exports.Actor || (exports.Actor = {}));
var DialInteractionEvent;
(function (DialInteractionEvent) {
    DialInteractionEvent["BUTTON_PRESSED"] = "BUTTON_PRESSED";
    DialInteractionEvent["GO_UP"] = "GO_UP";
    DialInteractionEvent["GO_DOWN"] = "GO_DOWN";
    DialInteractionEvent["BUTTON_LONG_PRESS"] = "BUTTON_LONG_PRESS";
})(DialInteractionEvent = exports.DialInteractionEvent || (exports.DialInteractionEvent = {}));
exports.DIAL_INTERACTION_EVENT = "DIAL_INTERACTION_EVENT";
exports.OPERATION_SUCCESS = "OPERATION_SUCCESS";
exports.OPERATION_FAILED = "OPERATION_FAILED";
