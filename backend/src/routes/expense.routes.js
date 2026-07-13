const express = require("express");
const { createExpense, getExpenseById, deleteExpense } = require("../controllers/expense.controller");

const router = express.Router();

router.post("/", createExpense);
router.get("/:expenseId", getExpenseById);
router.delete("/:expenseId", deleteExpense);

module.exports = router;
