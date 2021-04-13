"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.synthVersion = void 0;
exports.synthVersion = process.env.SYNTH_VERSION || "1";
console.log(`Synth version: ${exports.synthVersion}`);
