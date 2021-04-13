import { SH1106 } from 'sh1106';

export class LCD2 {
    device: SH1106;
    public content: (string | undefined)[] = [undefined, undefined];

    constructor() {
        this.device = new SH1106(128, 64);
    }

    print(message = "", lineNum = 0) {
        this.device.canvas.text(1, lineNum, message, 1);
        this.content[lineNum] = message;
    }
}