/*
  Warnings:

  - A unique constraint covering the columns `[expenseId,userId]` on the table `ExpenseSplit` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ExpenseSplit_expenseId_userId_key" ON "ExpenseSplit"("expenseId", "userId");
