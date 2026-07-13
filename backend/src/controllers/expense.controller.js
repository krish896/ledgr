const expenseService = require("../services/expense.service");

async function createExpense(req, res) {
  const result = await expenseService.createExpense(req.body, req.user);
  res.status(201).json(result);
}

async function getExpenseById(req, res) {
  const result = await expenseService.getExpenseById(req.params.expenseId, req.user);
  res.status(200).json(result);
}

async function deleteExpense(req, res) {
  const result = await expenseService.deleteExpense(req.params.expenseId, req.user);
  res.status(200).json(result);
}

module.exports = { createExpense, getExpenseById, deleteExpense };
