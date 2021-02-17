"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LcdToastRemover = void 0;
const nact_1 = require("nact");
const LcdControllerActor_1 = require("./LcdControllerActor");
const LcdToastRemover = (root) => nact_1.spawnStateless(root, (msg, ctx) => {
    if (msg.type === "SHOW") {
        const { id, durationMs } = msg;
        setTimeout(() => nact_1.dispatch(root, {
            type: LcdControllerActor_1.LcdControllerActorMessages.HIDE_TOAST,
            id,
        }), durationMs);
    }
});
exports.LcdToastRemover = LcdToastRemover;
