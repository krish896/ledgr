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

function simplifyDebts(balances) {
  const net = new Map();
  for (const { fromUserId, toUserId, amount } of balances) {
    net.set(fromUserId, (net.get(fromUserId) ?? 0n) - amount);
    net.set(toUserId,   (net.get(toUserId)   ?? 0n) + amount);
  }

  const people = Array.from(net.entries()).map(([id, net]) => ({ id, net }));
  const result = [];

  while (true) {
    let maxCreditor = null;
    let maxDebtor   = null;
    for (const p of people) {
      if (p.net > 0n && (maxCreditor === null || p.net > maxCreditor.net)) maxCreditor = p;
      if (p.net < 0n && (maxDebtor   === null || p.net < maxDebtor.net))   maxDebtor   = p;
    }
    if (!maxCreditor || !maxDebtor) break;

    const payment = maxCreditor.net < -maxDebtor.net ? maxCreditor.net : -maxDebtor.net;
    result.push({ fromUserId: maxDebtor.id, toUserId: maxCreditor.id, amount: payment });
    maxCreditor.net -= payment;
    maxDebtor.net   += payment;
  }

  return result;
}

module.exports = { computeBalances, simplifyDebts };
