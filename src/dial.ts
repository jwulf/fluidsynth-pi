import five from "johnny-five";
import { board } from "./board";
const delay = parseInt(process.env.ROTARY_DELAY || "500", 10);

let cycle: "DOWN" | "PRESS" | "HOLD" | "UP" = "DOWN";

function rotaryEncoder({
  aPin,
  bPin,
  pressButton,
  onUp,
  onDown,
  onPress,
  onHold,
}: {
  aPin: five.Pin;
  bPin: five.Pin;
  pressButton: five.Button;
  onUp: () => void;
  onDown: () => void;
  onPress: () => void;
  onHold: () => void;
}) {
  // https://gist.github.com/rwaldron/5db750527f257636c5d3b2c492737c99
  let value = 0;
  let rotation = 0;
  let last = 0;
  let lValue = 0;
  let emitTimer: NodeJS.Timeout | undefined;

  const handler = function () {
    // this.emit("data", this.value);
    if (!emitTimer) {
      const current = value;
      emitTimer = setTimeout(() => {
        if (current != value) {
          const isUp = current > value;
          if (isUp) {
            onUp();
          } else {
            onDown();
          }
        }
        emitTimer = undefined;
      }, delay);
    }

    var MSB = aPin.value;
    var LSB = bPin.value;
    var pos, turn;

    if (LSB === 1) {
      pos = MSB === 1 ? 0 : 1;
    } else {
      pos = MSB === 0 ? 2 : 3;
    }

    turn = pos - last;

    if (Math.abs(turn) !== 2) {
      if (turn === -1 || turn === 3) {
        value++;
      } else if (turn === 1 || turn === -3) {
        value--;
      }
    }

    last = pos;

    if (lValue !== value) {
      // this.emit("change", value);
      // console.log("change", value);
    }

    if (value % 80 === 0 && value / 80 !== rotation) {
      rotation = value / 80;
      console.log("rotation");
    }

    lValue = value;
  };

  bPin.on("change", handler);
  aPin.on("change", handler);
  pressButton.on("down", () => (cycle = "DOWN"));
  pressButton.on("press", () => (cycle = "PRESS"));
  pressButton.on("hold", () => (cycle = "HOLD"));

  pressButton.on("up", () => {
    // It cycles "DOWN" -> "PRESS" -> ["HOLD"] -> "UP"
    if (cycle === "PRESS") {
      onPress();
    } else {
      onHold();
    }
  });
}

type Handler = () => void;
export class Dial {
  board: any;

  constructor({
    onDown,
    onPress,
    onUp,
    onHold,
  }: {
    onPress: Handler;
    onUp: Handler;
    onDown: Handler;
    onHold: Handler;
  }) {
    board().ready.then(() => {
      const aPin = new five.Pin({
        pin: "GPIO4",
        type: "digital",
        mode: 0,
      } as any);

      const bPin = new five.Pin({
        pin: "GPIO5",
        type: "digital",
        mode: 0,
      } as any);
      (aPin as any).io.digitalWrite("GPIO4", (aPin as any).io.HIGH);
      (bPin as any).io.digitalWrite("GPIO5", (bPin as any).io.HIGH);

      const pressButton = new five.Button({ pin: "GPIO6", isPullup: true });
      rotaryEncoder({
        aPin,
        bPin,
        pressButton,
        onUp: () => {
          console.log("up");
          onUp();
        },
        onDown: () => {
          console.log("down");
          onDown();
        },
        onPress: () => {
          console.log("press");
          onPress();
        },
        onHold: () => {
          console.log("hold");
          onHold();
        },
      });
    });
  }
}
