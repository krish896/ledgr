const express = require("express");
const { createExpense, getExpenseById, deleteExpense } = require("../controllers/expense.controller");
const { createReceipt, serveReceipt } = require("../controllers/receipt.controller");

const router = express.Router();

router.post("/receipts", createReceipt);
router.get("/receipts/:filename", serveReceipt);
router.post("/", createExpense);
router.get("/:expenseId", getExpenseById);
router.delete("/:expenseId", deleteExpense);

module.exports = router;
