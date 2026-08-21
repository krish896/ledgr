const { processOcr } = require("../services/ocr.service");

async function createOcrDraft(req, res) {
  const result = await processOcr(req.body);
  res.status(200).json(result);
}

module.exports = { createOcrDraft };
