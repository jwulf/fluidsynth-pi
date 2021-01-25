import { RequestHandler } from "express";
import fileUpload from "express-fileupload";
import path from "path";

export const uploadHandler: (log: any, updateFn: any) => RequestHandler = (
  log: any,
  updateFn
) => async (req, res) => {
  try {
    if (!req.files) {
      res.send({
        status: false,
        message: "No file uploaded",
      });
    } else {
      //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
      let soundfont = req.files.soundfont as fileUpload.UploadedFile;

      const name = soundfont.name.split(" ").join("_");
      //Use the mv() method to place the file in soundfonts directory
      await soundfont.mv(path.join(__dirname, "..", "soundfonts", name));

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
  } catch (err) {
    res.status(500).send(err);
  }
};
