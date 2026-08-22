const express = require("express");
const {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  addMember,
  getBalances,
} = require("../controllers/group.controller");
const { getGroupExpenses } = require("../controllers/expense.controller");
const { createUpiLink } = require("../controllers/upi.controller");

const router = express.Router();

router.post("/", createGroup);
router.get("/", getGroups);
router.get("/:groupId", getGroupById);
router.get("/:groupId/balances", getBalances);
router.get("/:groupId/expenses", getGroupExpenses);

router.patch("/:groupId", updateGroup);
router.post("/:groupId/members", addMember);
router.post("/:groupId/upi-link", createUpiLink);

module.exports = router;
