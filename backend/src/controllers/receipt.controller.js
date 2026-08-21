const fs = require("fs");
const multer = require("multer");
const { upload } = require("../middleware/upload.middleware");
const { uploadReceipt, getReceipt } = require("../services/receipt.service");
const ValidationError = require("../errors/ValidationError");

const uploadSingle = upload.single("receipt");

async function createReceipt(req, res, next) {
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "File too large. Maximum size is 5 MB"
          : err.message || "Invalid file";
      return next(new ValidationError(message));
    }
    if (err) return next(err);

    if (!req.file) return next(new ValidationError("No file uploaded"));

    const result = uploadReceipt(req.file);
    res.status(201).json(result);
  });
}

async function serveReceipt(req, res, next) {
  try {
    const { filePath, contentType } = await getReceipt(req.params.filename);
    res.setHeader("Content-Type", contentType);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    next(err);
  }
}

module.exports = { createReceipt, serveReceipt };
