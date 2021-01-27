import five from "johnny-five";
import { Log } from "./ringlog";

let _board: Board;
export class Board {
  private board: five.Board;
  public ready: Promise<five.Board>;
  log: (msg: string) => void;
  constructor() {
    const Raspi = require("raspi-io").RaspiIO;

    this.log = Log();
    this.log("Starting j5...");
    this.board = new five.Board({ repl: false, io: new Raspi() });
    this.ready = new Promise((res) =>
      this.board.on("ready", () => {
        this.log("Board ready...");
        res(this.board);
      })
    );
  }
}

export const board = () => (_board ? _board : (_board = new Board()) || _board);
