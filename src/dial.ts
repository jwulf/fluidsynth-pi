import chalk from "chalk";
import five from "johnny-five";
import { board } from "./board";
import { Log } from "./ringlog";

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
      this.upButton = new five.Button({
        pin: "GPIO4",
        isPullup: true,
      });
      this.downButton = new five.Button({
        pin: "GPIO5",
        isPullup: true,
      });
      this.pressButton = new five.Button({ pin: "GPIO6", isPullup: true });
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

function rotaryEncoder({
  upButton,
  downButton,
  pressButton,
  onUp,
  onDown,
  onPress,
}: {
  upButton: five.Button;
  downButton: five.Button;
  pressButton: five.Button;
  onUp: () => void;
  onDown: () => void;
  onPress: () => void;
}) {
  let waveform = "";
  let waveformTimeout: NodeJS.Timeout;

  upButton.on("up", () => {
    waveform += "1";
    handleWaveform();
  });

  downButton.on("up", () => {
    waveform += "0";
    handleWaveform();
  });

  pressButton.on("up", () => {
    onPress();
  });

  function handleWaveform() {
    if (waveform.length < 2) {
      waveformTimeout = setTimeout(() => {
        waveform = "";
      }, 8);
      return;
    }

    if (waveformTimeout) {
      clearTimeout(waveformTimeout);
    }

    if (waveform === "01") {
      onUp();
    } else if (waveform === "10") {
      onDown();
    }

    waveform = "";
  }
}
