import { Collection } from "./Collection";

const indexCollection = <T>(c: T[]) =>
  c.map((e, i) => ({ value: e, index: i }));

const Chars = new Collection([
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890.,!?*#@()".split(
    ""
  ),
  ":retarrow:",
]);
