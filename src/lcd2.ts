import { SH1106 } from 'sh1106';

export class LCD2 {
    device: SH1106;
    public content: (string | undefined)[] = [undefined, undefined];

    constructor() {
        this.device = new SH1106(128, 64);
    }

    print = (message = "", lineNum = 0) => {
        this.device.canvas.clear();
        this.content[lineNum] = message;
        this.content.forEach((msg, i) => this.device.canvas.text(1, i * 30, msg ?? '', 1));
        // this.device.canvas.rectangle(1, 1, 120, 60, true)
        this.device.refresh();
        console.log("LCD:", message)
    }
}