import { ActorSystem, ActorSystemRef, dispatch } from "nact";
import { DialInteractionEvent } from "./ActorConstants";
import { Dial } from "./dial";
import { Dial2 } from "./Dial2";
import { MenuControllerActorMessages } from "./MenuControllerActor";
import { synthVersion } from "./version";

export const createDial = (menuController: ActorSystemRef) => {
  const DialClass = synthVersion === "1" ? Dial : Dial2

  new DialClass({
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
    onHold: () =>
      dispatch(menuController, {
        type: MenuControllerActorMessages.DIAL_INTERACTION_EVENT,
        event_type: DialInteractionEvent.BUTTON_LONG_PRESS,
      }),
  });
}
