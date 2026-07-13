const express = require("express");
const { createSettlement } = require("../controllers/settlement.controller");

const router = express.Router();

router.post("/", createSettlement);

module.exports = router;
