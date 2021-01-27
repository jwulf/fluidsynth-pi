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
exports.uploadHandler = void 0;
const path_1 = __importDefault(require("path"));
const uploadHandler = (log, updateFn) => (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.files) {
            res.send({
                status: false,
                message: "No file uploaded",
            });
        }
        else {
            //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
            let soundfont = req.files.soundfont;
            const name = soundfont.name.split(" ").join("_");
            //Use the mv() method to place the file in soundfonts directory
            yield soundfont.mv(path_1.default.join(__dirname, "..", "soundfonts", name));
            // Update available soundfonts
            updateFn();
            //send response
            res.send({
                status: true,
                message: "File is uploaded",
                data: {
                    name,
                    mimetype: soundfont.mimetype,
                    size: soundfont.size,
                },
            });
            log(`Uploaded new soundfont: ${name}`);
            // refresh soundfonts
        }
    }
    catch (err) {
        res.status(500).send(err);
    }
});
exports.uploadHandler = uploadHandler;
