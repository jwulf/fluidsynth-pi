"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveCursor = exports.updateDisplay = exports.makeDisplayName = void 0;
const nact_1 = require("nact");
const ActorConstants_1 = require("./ActorConstants");
const LcdControllerActor_1 = require("./LcdControllerActor");
const main_1 = require("./main");
function makeDisplayName(scrolling, cursor) {
    var _a, _b, _c;
    return cursor.item === null
        ? "Empty"
        : scrolling
            ? (_a = cursor.item) === null || _a === void 0 ? void 0 : _a.displayName : `:arrowright: ${(_c = (_b = cursor.item) === null || _b === void 0 ? void 0 : _b.displayName) === null || _c === void 0 ? void 0 : _c.padEnd(14, " ")}`;
}
exports.makeDisplayName = makeDisplayName;
function updateDisplay(lcdController, text) {
    nact_1.dispatch(lcdController, {
        type: LcdControllerActor_1.LcdControllerActorMessages.PRINT,
        text,
        line: 0,
    });
    nact_1.dispatch(lcdController, {
        type: LcdControllerActor_1.LcdControllerActorMessages.PRINT,
        text: "",
        line: 1,
    });
}
exports.updateDisplay = updateDisplay;
function moveCursor(msg, state) {
    var _a, _b, _c, _d;
    const previous = (_a = state.cursor.item) === null || _a === void 0 ? void 0 : _a.uuid;
    msg.event_type === ActorConstants_1.DialInteractionEvent.GO_DOWN
        ? state.cursor.moveBack()
        : state.cursor.moveForward();
    const justChanged = ((_b = state.cursor.item) === null || _b === void 0 ? void 0 : _b.uuid) !== previous;
    const scrolling = ((_c = state.cursor.item) === null || _c === void 0 ? void 0 : _c.uuid) !== ((_d = state.currentlySelected) === null || _d === void 0 ? void 0 : _d.uuid);
    if (justChanged) {
        nact_1.dispatch(main_1.lcdController, {
            type: LcdControllerActor_1.LcdControllerActorMessages.PRINT,
            text: makeDisplayName(scrolling, state.cursor),
            line: 0,
        });
    }
    return scrolling;
}
exports.moveCursor = moveCursor;
