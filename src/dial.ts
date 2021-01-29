import chalk from "chalk";
import five from "johnny-five";
import { board } from "./board";
import { Log } from "./ringlog";

function rotaryEncoder({
  aPin,
  bPin,
  pressButton,
  onUp,
  onDown,
  onPress,
}: {
  aPin: five.Pin;
  bPin: five.Pin;
  pressButton: five.Button;
  onUp: () => void;
  onDown: () => void;
  onPress: () => void;
}) {
  aPin.on("low", () => {
    const bPinState = bPin.value;
    console.log(`aPin: low, bPin: ${bPinState}`);
  });

  bPin.on("low", () => {
    const aPinState = aPin.value;
    console.log(`bPin: low, aPin: ${aPinState}`);
  });

  pressButton.on("up", () => {
    onPress();
  });
}

export class Dial {
  dial!: five.LCD;
  log: (msg: string) => void;
  board: any;
  upButton!: five.Pin;
  downButton!: five.Pin;
  pressButton!: five.Button;
  constructor() {
    this.log = Log(chalk.greenBright);
    board().ready.then(() => {
      const aPin = new five.Pin("GPIO4");
      const bPin = new five.Pin("GPIO5");
      this.pressButton = new five.Button({ pin: "GPIO6", isPullup: true });
      rotaryEncoder({
        aPin,
        bPin,
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

// export class Dial {
//   dial!: five.LCD;
//   log: (msg: string) => void;
//   board: any;
//   upButton!: five.Button;
//   downButton!: five.Button;
//   pressButton!: five.Button;
//   constructor() {
//     this.log = Log(chalk.greenBright);
//     board().ready.then((board) => {
//       this.upButton = new five.Pin({
//         pin: "GPIO4",
//         isPullup: true,
//       });
//       this.downButton = new five.Button({
//         pin: "GPIO5",
//         isPullup: true,
//       });
//       this.pressButton = new five.Button({ pin: "GPIO6", isPullup: true });
//       rotaryEncoder({
//         upButton: this.upButton,
//         downButton: this.downButton,
//         pressButton: this.pressButton,
//         onUp: () => {
//           console.log("up");
//         },
//         onDown: () => {
//           console.log("down");
//         },
//         onPress: () => {
//           console.log("press");
//         },
//       });
//     });
//   }
// }

// function rotaryEncoder({
//   upButton,
//   downButton,
//   pressButton,
//   onUp,
//   onDown,
//   onPress,
// }: {
//   upButton: five.Button;
//   downButton: five.Button;
//   pressButton: five.Button;
//   onUp: () => void;
//   onDown: () => void;
//   onPress: () => void;
// }) {
//   let waveform = "";
//   let waveformTimeout: NodeJS.Timeout;

//   upButton.on("up", () => {
//     waveform += "1";
//     handleWaveform();
//   });

//   downButton.on("up", () => {
//     waveform += "0";
//     handleWaveform();
//   });

//   pressButton.on("up", () => {
//     onPress();
//   });

//   function handleWaveform() {
//     if (waveform.length < 2) {
//       waveformTimeout = setTimeout(() => {
//         waveform = "";
//       }, 4);
//       return;
//     }

//     if (waveformTimeout) {
//       clearTimeout(waveformTimeout);
//     }

//     if (waveform === "01") {
//       onUp();
//     } else if (waveform === "10") {
//       onDown();
//     }

//     waveform = "";
//   }
// }
