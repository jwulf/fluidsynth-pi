"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDial = void 0;
const nact_1 = require("nact");
const ActorConstants_1 = require("./ActorConstants");
const dial_1 = require("./dial");
const Dial2_1 = require("./Dial2");
const MenuControllerActor_1 = require("./MenuControllerActor");
const version_1 = require("./version");
const createDial = (menuController) => {
    const DialClass = version_1.synthVersion === "1" ? dial_1.Dial : Dial2_1.Dial2;
    new DialClass({
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
};
exports.createDial = createDial;
