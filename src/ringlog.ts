import chalk from "chalk";
import { EventEmitter } from "events";
class RingLog extends EventEmitter {
  public messages: string[] = [];
  constructor(private size: number = 200) {
    super();
  }
  log(message: string) {
    this.messages.push(message);
    if (this.messages.length > this.size) {
      this.messages.splice(0, 1);
    }
    this.emit("message", message);
  }
  clear() {
    this.messages = [];
  }
}

export const ringlog = new RingLog(40);
export const Log = (color = chalk.yellowBright) => (msg: string) => {
  console.log(color(msg));
  ringlog.log(msg);
};
