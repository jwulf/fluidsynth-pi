const chokidar = require("chokidar");
const { queue } = require('async')
const cp = require('child_process')
console.log(__dirname)

const q = queue(() => {
    console.log(new Date())
    const res = cp.execSync('rsync -zav ../dist root@dietpi4.local:~/fluidsynth-pi/')
    console.log(res.toString())
}, 1)

chokidar.watch('../dist', {
    persistent: true,
    awaitWriteFinish: true
}).on('all', () => q.push({}))
