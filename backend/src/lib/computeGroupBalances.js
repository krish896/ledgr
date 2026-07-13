const prisma = require("./prisma");
const { computeBalances } = require("./balanceEngine");

async function computeGroupBalances(groupId) {
  const expenses = await prisma.expense.findMany({
    where: { groupId, deletedAt: null },
    include: {
      splits: {
        select: { userId: true, amount: true },
      },
    },
  });

  const settlements = await prisma.settlement.findMany({
    where: { groupId },
    select: { fromUserId: true, toUserId: true, amount: true },
  });

  return computeBalances({ expenses, settlements });
}

module.exports = { computeGroupBalances };
