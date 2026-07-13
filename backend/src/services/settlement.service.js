const { z } = require("zod");
const ValidationError = require("../errors/ValidationError");
const prisma = require("../lib/prisma");
const { ensureActiveMember } = require("../lib/groupMembership");
const { computeGroupBalances } = require("../lib/computeGroupBalances");

const createSettlementSchema = z.object({
  groupId: z.string(),
  toUserId: z.string(),
  amount: z.number().int().positive(),
  note: z.string().trim().max(500).optional(),
});

async function createSettlement(body, actor) {
  const result = createSettlementSchema.safeParse(body);
  if (!result.success) throw new ValidationError(result.error.issues[0].message);

  const { groupId, toUserId } = result.data;

  await ensureActiveMember(groupId, actor.userId);
  await ensureActiveMember(groupId, toUserId);

  if (actor.userId === toUserId)
    throw new ValidationError("You cannot settle with yourself");

  const balances = await computeGroupBalances(groupId);

  const balance = balances.find(
    (b) => b.fromUserId === actor.userId && b.toUserId === toUserId
  );

  if (!balance)
    throw new ValidationError("No outstanding balance found");

  if (result.data.amount > balance.amount)
    throw new ValidationError("Settlement amount exceeds outstanding balance");

  const settlement = await prisma.settlement.create({
    data: {
      groupId: result.data.groupId,
      fromUserId: actor.userId,
      toUserId: result.data.toUserId,
      amount: BigInt(result.data.amount),
      note: result.data.note,
    },
  });

  return {
    settlement: {
      id: settlement.id,
      groupId: settlement.groupId,
      fromUserId: settlement.fromUserId,
      toUserId: settlement.toUserId,
      amount: settlement.amount,
      note: settlement.note,
      createdAt: settlement.createdAt,
      updatedAt: settlement.updatedAt,
    },
  };
}

module.exports = { createSettlement };
