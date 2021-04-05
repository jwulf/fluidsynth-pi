import { query, Ref } from "nact";

export enum Actor {
  "LcdController" = "LcdController",
  "LcdToaster" = "LcdToaster",
  "MenuController" = "MenuController",
  "SoundFontLibrary" = "SoundFontLibrary",
  "SoundFontLibraryCursor" = "SoundFontLibraryCursor",
  "Fluidsynth" = "Fluidsynth",
  "MenuFavorites" = "MenuFavorites",
  "InstrumentContext" = "InstrumentContext",
}

export enum DialInteractionEvent {
  BUTTON_PRESSED = "BUTTON_PRESSED",
  GO_UP = "GO_UP",
  GO_DOWN = "GO_DOWN",
  BUTTON_LONG_PRESS = "BUTTON_LONG_PRESS",
}

export interface DialInteractionEventMessage {
  type: typeof DIAL_INTERACTION_EVENT;
  event_type: DialInteractionEvent;
}

export const DIAL_INTERACTION_EVENT = "DIAL_INTERACTION_EVENT" as const;

export const OPERATION_SUCCESS = "OPERATION_SUCCESS";
export const OPERATION_FAILED = "OPERATION_FAILED";
export type OperationResult = {
  result: typeof OPERATION_FAILED | typeof OPERATION_SUCCESS;
};
