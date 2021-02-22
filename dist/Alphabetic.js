"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Collection_1 = require("./Collection");
const indexCollection = (c) => c.map((e, i) => ({ value: e, index: i }));
const Chars = new Collection_1.Collection([
    ..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890.,!?*#@()".split(""),
    ":retarrow:",
]);
