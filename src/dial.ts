import chalk from "chalk";
import five from "johnny-five";
import { board } from "./board";
import { Log } from "./ringlog";
import rotaryEncoder from "johnny-five-rotary-encoder";

export class Dial {
  dial!: five.LCD;
  log: (msg: string) => void;
  board: any;
  upButton!: five.Button;
  downButton!: five.Button;
  pressButton!: five.Button;
  constructor() {
    this.log = Log(chalk.greenBright);
    board().ready.then((board) => {
      this.upButton = new five.Button("GPIO20");
      this.downButton = new five.Button("GPIO21");
      this.pressButton = new five.Button({ pin: "GPIO16", invert: true });
      rotaryEncoder({
        upButton: this.upButton,
        downButton: this.downButton,
        pressButton: this.pressButton,
        onUp: () => {
          console.log("up");
        },
        onDown: () => {
          console.log("down");
        },
        onPress: () => {
          console.log("press");
        },
      });
    });
  }
}
