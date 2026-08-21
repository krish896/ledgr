const fs = require("fs");
const path = require("path");
const NotFoundError = require("../errors/NotFoundError");
const ValidationError = require("../errors/ValidationError");

const UPLOAD_DIR = path.join(__dirname, "../../uploads/receipts");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const FILENAME_RE = /^rcpt_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$/;

const CONTENT_TYPE = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

function getReceiptUrl(filename) {
  return `/uploads/receipts/${filename}`;
}

function uploadReceipt(file) {
  const receiptId = file.receiptId;
  const receiptImageUrl = getReceiptUrl(file.filename);
  return { receiptId, receiptImageUrl };
}

async function getReceipt(filename) {
  if (!FILENAME_RE.test(filename)) throw new ValidationError("Invalid receipt filename");

  const filePath = path.resolve(UPLOAD_DIR, filename);
  if (!filePath.startsWith(UPLOAD_DIR + path.sep)) throw new ValidationError("Invalid receipt filename");

  try {
    await fs.promises.access(filePath, fs.constants.R_OK);
  } catch {
    throw new NotFoundError("Receipt not found");
  }

  const ext = filename.split(".").pop();
  return { filePath, contentType: CONTENT_TYPE[ext] };
}

module.exports = { uploadReceipt, getReceipt };
