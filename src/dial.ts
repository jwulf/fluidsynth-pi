import five from "johnny-five";
import { board } from "./board";
const delay = parseInt(process.env.DELAY || "500", 10);
// Make this thing debounced.
// Detect direction, and emit every n seconds.
// When emit, cancel any pending direction detection
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
          console.log(
            current > value ? "up" : "down",
            `(was: ${current}, now: ${value})`
          );
        }
        emitTimer = undefined;
      }, delay);
    }
    // console.log("data", value);

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
  // () => {

  // console.log("[BPin trigger]: ", aPin.value, bPin.value);
  // (aPin.value ? onDown() : onUp())
  // });
  aPin.on("change", handler);
  // () =>
  // console.log("[APin trigger]: ", aPin.value, bPin.value)
  // );
  pressButton.on("up", () => onPress());
}

type Handler = () => void;
export class Dial {
  board: any;

  constructor({
    onDown,
    onPress,
    onUp,
  }: {
    onPress: Handler;
    onUp: Handler;
    onDown: Handler;
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
