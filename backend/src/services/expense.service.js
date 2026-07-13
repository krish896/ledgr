const { z } = require("zod");
const ValidationError = require("../errors/ValidationError");
const prisma = require("../lib/prisma");
const NotFoundError = require("../errors/NotFoundError");
const { ensureActiveMember } = require("../lib/groupMembership");

const equalExpenseSchema = z.object({
  groupId:      z.string(),
  payerId:      z.string(),
  amount:       z.number().int().positive(),
  description:  z.string().trim().min(1).max(500),
  occurredAt:   z.coerce.date(),
  splitType:    z.literal("EQUAL"),
  participants: z.array(z.string()).min(1),
});

const exactExpenseSchema = z.object({
  groupId:     z.string(),
  payerId:     z.string(),
  amount:      z.number().int().positive(),
  description: z.string().trim().min(1).max(500),
  occurredAt:  z.coerce.date(),
  splitType:   z.literal("EXACT"),
  splits: z.array(
    z.object({
      userId: z.string(),
      amount: z.number().int().positive(),
    })
  ).min(1),
});

const createExpenseSchema = z.discriminatedUnion("splitType", [
  equalExpenseSchema,
  exactExpenseSchema,
]);

async function createExpense(body, actor) {
  const result = createExpenseSchema.safeParse(body);
  if (!result.success) throw new ValidationError(result.error.issues[0].message);

  const { groupId, payerId, splitType } = result.data;

  await ensureActiveMember(groupId, actor.userId);
  await ensureActiveMember(groupId, payerId);

  const participantIds =
    splitType === "EQUAL"
      ? result.data.participants
      : result.data.splits.map((s) => s.userId);

  const unique = new Set(participantIds);
  if (unique.size !== participantIds.length)
    throw new ValidationError("Duplicate participants are not allowed");

  for (const userId of unique) {
    await ensureActiveMember(groupId, userId);
  }

  let normalizedSplits;

  if (splitType === "EQUAL") {
    const total = result.data.amount;
    const n = participantIds.length;
    const baseShare = Math.floor(total / n);
    const remainder = total % n;

    const sorted = [...participantIds].sort();

    normalizedSplits = sorted.map((userId, i) => ({
      userId,
      amount: i < remainder ? baseShare + 1 : baseShare,
    }));
  } else {
    const splitTotal = result.data.splits.reduce((sum, s) => sum + s.amount, 0);
    if (splitTotal !== result.data.amount)
      throw new ValidationError("Split amounts must equal expense amount");

    normalizedSplits = result.data.splits;
  }

  const expense = await prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        groupId,
        payerId,
        amount: BigInt(result.data.amount),
        description: result.data.description,
        splitType,
        occurredAt: result.data.occurredAt,
      },
    });

    await tx.expenseSplit.createMany({
      data: normalizedSplits.map((split) => ({
        expenseId: expense.id,
        userId: split.userId,
        amount: BigInt(split.amount),
      })),
    });

    return expense;
  });

  return {
    expense: {
      id: expense.id,
      groupId: expense.groupId,
      payerId: expense.payerId,
      amount: expense.amount,
      description: expense.description,
      splitType: expense.splitType,
      occurredAt: expense.occurredAt,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    },
  };
}

async function getExpenseById(expenseId, actor) {
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, deletedAt: null },
    include: {
      splits: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
  if (!expense) throw new NotFoundError("Expense not found");

  await ensureActiveMember(expense.groupId, actor.userId);

  return {
    expense: {
      id: expense.id,
      groupId: expense.groupId,
      payerId: expense.payerId,
      amount: expense.amount,
      description: expense.description,
      splitType: expense.splitType,
      occurredAt: expense.occurredAt,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
      participants: expense.splits.map((split) => ({
        user: split.user,
        amount: split.amount,
      })),
    },
  };
}

async function deleteExpense(expenseId, actor) {
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, deletedAt: null },
  });
  if (!expense) throw new NotFoundError("Expense not found");

  await ensureActiveMember(expense.groupId, actor.userId);

  await prisma.expense.update({
    where: { id: expenseId },
    data: { deletedAt: new Date() },
  });

  return { message: "Expense deleted successfully" };
}

module.exports = { createExpense, getExpenseById, deleteExpense };
