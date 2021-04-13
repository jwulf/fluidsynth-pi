import fs from "fs"
import cp from "child_process"

type Handler = () => void;

export class Dial2 {

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

        const pins: { number: number, cb: () => void, pressed: boolean }[] = [];

        const makeButton = async (msg: string, pin: number, cb: () => void) => {
            console.log(`Creating pin ${pin}`)
            const p = pin.toString()
            if (fs.existsSync(`/sys/class/gpio/gpio${p}`)) {
                cp.execSync(`echo ${p} > /sys/class/gpio/unexport`)
            }
            // await delay(100)
            cp.execSync(`echo ${p} > /sys/class/gpio/export`) // May need to be done manually
            // await delay(100)
            fs.writeFileSync(`/sys/class/gpio/gpio${p}/direction`, 'in')

            pins.push({
                number: pin,
                cb: () => {
                    console.log(`Pushed ${msg}`)
                    cb()
                },
                pressed: false
            })
        }

        setInterval(() => {
            pins.forEach(pin => {
                const state = fs.readFileSync(`/sys/class/gpio/gpio${pin.number}/value`, 'utf8')
                if (state[0] === '0') {
                    if (!pin.pressed) {
                        pin.pressed = true
                        pin.cb()
                    }
                } else {
                    pin.pressed = false
                }
            })
        }, 200)


        makeButton("up", 6, onHold);
        makeButton("down", 19, () => { })
        makeButton("left", 5, onDown)
        makeButton("right", 26, onUp)
        makeButton("press", 13, onPress)

        makeButton("key1", 21, onHold)
        makeButton("key2", 20, () => { })
        makeButton("key3", 16, () => { })
    }
}
