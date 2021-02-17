import { ActorSystem, ActorSystemRef, dispatch } from "nact";
import { DialInteractionEvent } from "./ActorConstants";
import { Dial } from "./dial";
import { MenuControllerActorMessages } from "./MenuControllerActor";

export const createDial = (menuController: ActorSystemRef) => {
  const dialEnabled =
    (process.env.ENABLE_LCD || "false").toLowerCase() === "true";

  if (dialEnabled) {
    new Dial({
      onDown: () =>
        dispatch(menuController, {
          type: MenuControllerActorMessages.DIAL_INTERACTION_EVENT,
          event_type: DialInteractionEvent.GO_DOWN,
        }),
      onPress: () =>
        dispatch(menuController, {
          type: MenuControllerActorMessages.DIAL_INTERACTION_EVENT,
          event_type: DialInteractionEvent.BUTTON_PRESSED,
        }),
      onUp: () =>
        dispatch(menuController, {
          type: MenuControllerActorMessages.DIAL_INTERACTION_EVENT,
          event_type: DialInteractionEvent.GO_UP,
        }),
    });
  }
};
