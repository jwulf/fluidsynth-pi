"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveCursor = exports.updateDisplay = exports.makeDisplayName = void 0;
const nact_1 = require("nact");
const ActorConstants_1 = require("./ActorConstants");
const LcdControllerActor_1 = require("./LcdControllerActor");
const main_1 = require("./main");
const version_1 = require("./version");
const arrow = version_1.synthVersion === "1" ? ':arrowright' : '►';
function makeDisplayName(scrolling, cursor) {
    var _a, _b, _c;
    return (cursor === null || cursor === void 0 ? void 0 : cursor.item) === null
        ? "Empty"
        : scrolling
            ? ((_a = cursor === null || cursor === void 0 ? void 0 : cursor.item) === null || _a === void 0 ? void 0 : _a.displayName) || "Unknown"
            : `${arrow} ${(_c = (_b = cursor === null || cursor === void 0 ? void 0 : cursor.item) === null || _b === void 0 ? void 0 : _b.displayName) === null || _c === void 0 ? void 0 : _c.padEnd(14, " ")}`;
}
exports.makeDisplayName = makeDisplayName;
function updateDisplay(lcdController, text, menuTitle = "") {
    const center = (s) => {
        const t = s.length < 14 ? `[${s}]` : s;
        const len = t.length;
        const endPadding = Math.floor((16 - len) / 2);
        return t.padEnd(16 - endPadding, " ").padStart(16, " ");
    };
    const fMenuTitle = menuTitle === "" ? "" : center(menuTitle);
    nact_1.dispatch(lcdController, {
        type: LcdControllerActor_1.LcdControllerActorMessages.PRINT,
        text,
        line: 0,
    });
    nact_1.dispatch(lcdController, {
        type: LcdControllerActor_1.LcdControllerActorMessages.PRINT,
        text: fMenuTitle,
        line: 1,
    });
}
exports.updateDisplay = updateDisplay;
function moveCursor(msg, state) {
    var _a, _b, _c, _d, _e, _f, _g;
    const previous = (_b = (_a = state.cursor) === null || _a === void 0 ? void 0 : _a.item) === null || _b === void 0 ? void 0 : _b.uuid;
    msg.event_type === ActorConstants_1.DialInteractionEvent.GO_DOWN
        ? state.cursor.moveBack()
        : state.cursor.moveForward();
    const justChanged = ((_d = (_c = state.cursor) === null || _c === void 0 ? void 0 : _c.item) === null || _d === void 0 ? void 0 : _d.uuid) !== previous;
    const scrolling = ((_f = (_e = state.cursor) === null || _e === void 0 ? void 0 : _e.item) === null || _f === void 0 ? void 0 : _f.uuid) !== ((_g = state.currentlySelected) === null || _g === void 0 ? void 0 : _g.uuid);
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
