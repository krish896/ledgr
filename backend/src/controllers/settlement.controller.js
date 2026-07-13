const settlementService = require("../services/settlement.service");

async function createSettlement(req, res) {
  const result = await settlementService.createSettlement(req.body, req.user);
  res.status(201).json(result);
}

module.exports = { createSettlement };
