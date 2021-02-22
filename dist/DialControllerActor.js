"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDial = void 0;
const nact_1 = require("nact");
const ActorConstants_1 = require("./ActorConstants");
const dial_1 = require("./dial");
const MenuControllerActor_1 = require("./MenuControllerActor");
const createDial = (menuController) => {
    const dialEnabled = (process.env.ENABLE_LCD || "false").toLowerCase() === "true";
    if (dialEnabled) {
        new dial_1.Dial({
            onDown: () => nact_1.dispatch(menuController, {
                type: MenuControllerActor_1.MenuControllerActorMessages.DIAL_INTERACTION_EVENT,
                event_type: ActorConstants_1.DialInteractionEvent.GO_DOWN,
            }),
            onPress: () => nact_1.dispatch(menuController, {
                type: MenuControllerActor_1.MenuControllerActorMessages.DIAL_INTERACTION_EVENT,
                event_type: ActorConstants_1.DialInteractionEvent.BUTTON_PRESSED,
            }),
            onUp: () => nact_1.dispatch(menuController, {
                type: MenuControllerActor_1.MenuControllerActorMessages.DIAL_INTERACTION_EVENT,
                event_type: ActorConstants_1.DialInteractionEvent.GO_UP,
            }),
            onHold: () => nact_1.dispatch(menuController, {
                type: MenuControllerActor_1.MenuControllerActorMessages.DIAL_INTERACTION_EVENT,
                event_type: ActorConstants_1.DialInteractionEvent.BUTTON_LONG_PRESS,
            }),
        });
    }
};
exports.createDial = createDial;
