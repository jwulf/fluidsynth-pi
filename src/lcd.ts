import five from "johnny-five";

export class LCD {
  board: any;
  lcd!: five.LCD;
  constructor(private log: any) {
    const Raspi = require("raspi-io").RaspiIO;

    this.log("Starting j5...");
    this.board = new five.Board({ repl: false, io: new Raspi() });
    this.board.on("ready", () => {
      this.log("Board ready...");
      this.lcd = new five.LCD({
        // pin layout for Zero W: https://pi4j.com/1.2/pins/model-zerow-rev1.html
        // lcd pins: ["GND", "VDD", "VO",  "RS", "RW", "EN", "DB0", "DB1", "DB2", "DB3", "DB4", "DB5", "DB6", "DB7", "LED+", "LED-"]
        // lcd pin - func -  rpi pin - func         -    note
        //    1      GND       6       GND
        //    2      VDD       1       +5V
        //    3      VO       pot      contrast
        //    4      RS        26      GPIO7           Register Select (instruction / data)
        //    5      RW        14      GND             Read (high) / Write (low)
        //    6      EN        24      GPIO8           Enable (writing to register)
        //    7      DB0       -       -
        //    8      DB1       -       -
        //    9      DB2       -       -
        //    10     DB3       -       -
        //    11     DB4       22      GPIO25
        //    12     DB5       18      GPIO24
        //    13     DB6       16      GPIO23
        //    14     DB7       12      GPIO18
        //    15     LED+      2       +5V
        //    16     LED-      20      GND
        pins: ["GPIO7", "GPIO8", "GPIO25", "GPIO24", "GPIO23", "GPIO18"],
        backlight: 6,
        rows: 2,
        cols: 20,
      });
    });
  }

  print(message = "", lineNum = 0) {
    if (this.lcd) {
      this.lcd.cursor(lineNum, 0).print(message);
    }
  }

  printAt(message = "", lineNum = 0, colNum = 0) {
    if (this.lcd) {
      this.lcd.cursor(lineNum, colNum).print(message);
    }
  }
}
