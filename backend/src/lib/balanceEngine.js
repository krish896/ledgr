function makeKey(fromUserId, toUserId) {
  return `${fromUserId}:${toUserId}`;
}

function parseKey(key) {
  const [fromUserId, toUserId] = key.split(":");
  return { fromUserId, toUserId };
}

function applyDelta(balances, fromUserId, toUserId, amount) {
  if (fromUserId === toUserId) return;

  const forwardKey = makeKey(fromUserId, toUserId);
  const reverseKey = makeKey(toUserId, fromUserId);

  if (balances.has(reverseKey)) {
    const reverseAmount = balances.get(reverseKey);

    if (reverseAmount > amount) {
      balances.set(reverseKey, reverseAmount - amount);
    } else if (reverseAmount === amount) {
      balances.delete(reverseKey);
    } else {
      balances.delete(reverseKey);
      balances.set(forwardKey, amount - reverseAmount);
    }
  } else {
    balances.set(forwardKey, (balances.get(forwardKey) ?? 0n) + amount);
  }
}

function computeBalances({ expenses, settlements }) {
  const balances = new Map();

  for (const expense of expenses) {
    for (const split of expense.splits) {
      applyDelta(balances, split.userId, expense.payerId, split.amount);
    }
  }

  for (const settlement of settlements) {
    applyDelta(balances, settlement.toUserId, settlement.fromUserId, settlement.amount);
  }

  return Array.from(balances.entries()).map(([key, amount]) => {
    const { fromUserId, toUserId } = parseKey(key);
    return { fromUserId, toUserId, amount };
  });
}

module.exports = { computeBalances };
