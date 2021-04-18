import fs from "fs"
import cp from "child_process"

type Handler = () => void;

const rpio = require("rpio")
const { LOW } = rpio

export class Dial2 {
    buffer: any;

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

        const makeButton = async ({ msg, pin, cb }: { msg: string, pin: number, cb: () => void }) => {
            console.log(`Creating pin ${pin}`)
            rpio.open(pin, rpio.INPUT, rpio.PULL_UP)
            // const p = pin.toString()
            // if (fs.existsSync(`/sys/class/gpio/gpio${p}`)) {
            //     cp.execSync(`echo ${p} > /sys/class/gpio/unexport`)
            // }
            // // await delay(100)
            // cp.execSync(`echo ${p} > /sys/class/gpio/export`) // May need to be done manually
            // // await delay(100)
            // fs.writeFileSync(`/sys/class/gpio/gpio${p}/direction`, 'in')

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
                const l = rpio.read(pin.number)
                // console.log(b, l)
                if (l !== LOW) {
                    pin.pressed = false
                    return
                }
                if (!pin.pressed) {
                    pin.pressed = true
                    pin.cb()
                }
            })
        }, 200)

        makeButton({ msg: "up", pin: 6, cb: onHold });
        makeButton({ msg: "down", pin: 19, cb: () => { } })
        makeButton({ msg: "left", pin: 5, cb: onDown })
        makeButton({ msg: "right", pin: 26, cb: onUp })
        makeButton({ msg: "press", pin: 13, cb: onPress })

        makeButton({ msg: "key1", pin: 21, cb: onHold })
        makeButton({ msg: "key2", pin: 20, cb: () => { } })
        makeButton({ msg: "key3", pin: 16, cb: () => { } })
    }
}
