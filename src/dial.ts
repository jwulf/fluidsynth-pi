import five from "johnny-five";
import { board } from "./board";

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
  bPin.on("change", () => {
    console.log("[BPin trigger]: ", aPin.value, bPin.value);
    // (aPin.value ? onDown() : onUp())
  });
  aPin.on("change", () =>
    console.log("[APin trigger]: ", aPin.value, bPin.value)
  );
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
