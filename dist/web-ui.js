"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWebInterface = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const body_parser_1 = __importDefault(require("body-parser"));
const socket_io_1 = require("socket.io");
const ringlog_1 = require("./ringlog");
const chalk_1 = __importDefault(require("chalk"));
const log = ringlog_1.Log(chalk_1.default.yellowBright);
function startWebInterface(fluidsynth, menu) {
    const app = express_1.default();
    const server = http_1.default.createServer(app);
    const io = new socket_io_1.Server(server);
    app.use(express_fileupload_1.default({
        createParentPath: true,
    }));
    app.use(body_parser_1.default.json());
    app.use(body_parser_1.default.urlencoded({ extended: true }));
    app.use(express_1.default.static(path_1.default.join(__dirname, "..", "node_modules")));
    app.use(express_1.default.static(path_1.default.join(__dirname, "..", "public")));
    // Upload soundfont - have to figure out how to get this work on insecure domain
    // app.post(
    //   "/upload",
    //   uploadHandler(log, () => (soundfonts = initialiseSoundFonts()))
    // );
    server.listen(3000);
    log("Webapp listening on port 3000");
    io.on("connection", (client) => {
        client.emit("log", ringlog_1.ringlog.messages.join("\n"));
        const onLogMessage = (msg) => client.emit("log", msg);
        ringlog_1.ringlog.on("message", onLogMessage);
        client.on("disconnection", () => ringlog_1.ringlog.removeListener("message", onLogMessage));
        client.on("getinstruments", () => io.emit("instrumentdump", {
            fonts: fluidsynth.getFontList(),
            currentSoundfont: fluidsynth.currentSoundFont,
        }));
        client.on("changeinst", loadSoundFont);
        client.on("restart_fluidsynth", restartFluidsynth);
        client.on("shutdown", () => menu.systemMenu.doShutdown());
    });
    function loadSoundFont(index) {
        return __awaiter(this, void 0, void 0, function* () {
            fluidsynth.ready.then(() => {
                const font = fluidsynth.getFontList()[index];
                fluidsynth.loadFont(font);
                menu.setMode("FONTS");
            });
        });
    }
    function restartFluidsynth() {
        return __awaiter(this, void 0, void 0, function* () {
            fluidsynth.restart();
        });
    }
}
exports.startWebInterface = startWebInterface;
