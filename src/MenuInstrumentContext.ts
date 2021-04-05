import { ActorSystemRef, spawn } from "nact";
import { Actor, DialInteractionEventMessage } from "./ActorConstants";
import { ActivateMenuMessage } from "./MenuControllerActor";

interface InstrumentContextState {}

type InstrumentContextMessage =
  | DialInteractionEventMessage
  | ActivateMenuMessage;

/**
 *
 * This component should take an activate menu message with a state
 *
 * The state
 */
export const InstrumentContextMenu = (parent: ActorSystemRef) =>
  spawn(
    parent,
    (
      state: InstrumentContextState = {},
      msg: InstrumentContextMessage,
      ctx
    ) => {},
    Actor.InstrumentContext
  );
