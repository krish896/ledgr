const { generateUpiLink } = require("../services/upi.service");

async function createUpiLink(req, res) {
  const result = await generateUpiLink(req.params.groupId, req.body, req.user);
  res.status(200).json(result);
}

module.exports = { createUpiLink };
