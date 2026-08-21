const { z } = require("zod");
const prisma = require("../lib/prisma");
const { ensureActiveMember } = require("../lib/groupMembership");
const { computeGroupBalances } = require("../lib/computeGroupBalances");
const ValidationError = require("../errors/ValidationError");
const NotFoundError = require("../errors/NotFoundError");

const upiLinkSchema = z.object({
  toUserId: z.string().min(1),
  amount:   z.number().int().positive(),
});

async function generateUpiLink(groupId, body, actor) {
  const result = upiLinkSchema.safeParse(body);
  if (!result.success) throw new ValidationError(result.error.issues[0].message);

  const { toUserId, amount } = result.data;

  if (actor.userId === toUserId) throw new ValidationError("You cannot generate a payment link to yourself");

  await ensureActiveMember(groupId, actor.userId);
  await ensureActiveMember(groupId, toUserId);

  const recipient = await prisma.user.findUnique({
    where:  { id: toUserId },
    select: { id: true, name: true, email: true, upiId: true },
  });
  if (!recipient) throw new NotFoundError("Recipient not found");
  if (!recipient.upiId) throw new ValidationError("Recipient has no UPI ID registered");

  const balances = await computeGroupBalances(groupId);
  const balance = balances.find(
    (b) => b.fromUserId === actor.userId && b.toUserId === toUserId
  );

  if (!balance) throw new ValidationError("No outstanding balance with this user");
  if (BigInt(amount) > balance.amount) throw new ValidationError("Amount exceeds outstanding balance");

  const rupees    = (amount / 100).toFixed(2);
  const payeeName = encodeURIComponent(recipient.name ?? recipient.email);
  const note      = encodeURIComponent("Ledgr Settlement");

  const upiLink = `upi://pay?pa=${encodeURIComponent(recipient.upiId)}&pn=${payeeName}&am=${rupees}&cu=INR&tn=${note}`;

  return {
    upiLink,
    recipient: {
      id:    recipient.id,
      name:  recipient.name,
      upiId: recipient.upiId,
    },
    amount,
    groupId,
  };
}

module.exports = { generateUpiLink };
