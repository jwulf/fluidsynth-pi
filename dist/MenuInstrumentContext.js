"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstrumentContextMenu = void 0;
const nact_1 = require("nact");
const ActorConstants_1 = require("./ActorConstants");
/**
 *
 * This component should take an activate menu message with a state
 *
 * The state
 */
const InstrumentContextMenu = (parent) => nact_1.spawn(parent, (state = {}, msg, ctx) => { }, ActorConstants_1.Actor.InstrumentContext);
exports.InstrumentContextMenu = InstrumentContextMenu;
