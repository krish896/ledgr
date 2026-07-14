const { computeBalances } = require("../balanceEngine");

function findBalance(balances, fromUserId, toUserId) {
  return balances.find(
    (b) => b.fromUserId === fromUserId && b.toUserId === toUserId
  );
}

describe("computeBalances", () => {
  describe("Empty ledger", () => {
    test("returns empty array when there are no expenses or settlements", () => {
      const result = computeBalances({ expenses: [], settlements: [] });

      expect(result).toEqual([]);
    });
  });

  describe("Single equal expense", () => {
    test("non-payer owes the payer their split share", () => {
      const expenses = [
        {
          payerId: "alice",
          splits: [
            { userId: "alice", amount: 15000n },
            { userId: "bob",   amount: 15000n },
          ],
        },
      ];

      const result = computeBalances({ expenses, settlements: [] });

      expect(result).toHaveLength(1);
      const balance = findBalance(result, "bob", "alice");
      expect(balance).toBeDefined();
      expect(balance.amount).toBe(15000n);
    });

    test("payer does not owe themselves", () => {
      const expenses = [
        {
          payerId: "alice",
          splits: [
            { userId: "alice", amount: 15000n },
            { userId: "bob",   amount: 15000n },
          ],
        },
      ];

      const result = computeBalances({ expenses, settlements: [] });

      expect(findBalance(result, "alice", "alice")).toBeUndefined();
    });
  });

  describe("Single exact expense", () => {
    test("non-payer owes only their exact split amount", () => {
      const expenses = [
        {
          payerId: "alice",
          splits: [
            { userId: "alice", amount: 4000n },
            { userId: "bob",   amount: 6000n },
          ],
        },
      ];

      const result = computeBalances({ expenses, settlements: [] });

      expect(result).toHaveLength(1);
      const balance = findBalance(result, "bob", "alice");
      expect(balance).toBeDefined();
      expect(balance.amount).toBe(6000n);
    });
  });

  describe("Multiple expenses", () => {
    test("debt accumulates across multiple expenses with the same payer", () => {
      const expenses = [
        {
          payerId: "alice",
          splits: [
            { userId: "alice", amount: 5000n },
            { userId: "bob",   amount: 5000n },
          ],
        },
        {
          payerId: "alice",
          splits: [
            { userId: "alice", amount: 3000n },
            { userId: "bob",   amount: 7000n },
          ],
        },
      ];

      const result = computeBalances({ expenses, settlements: [] });

      expect(result).toHaveLength(1);
      const balance = findBalance(result, "bob", "alice");
      expect(balance).toBeDefined();
      expect(balance.amount).toBe(12000n);
    });
  });

  describe("Debt accumulation", () => {
    test("merges repeated debts for the same pair into a single balance entry", () => {
      // Regression: guards the (balances.get(forwardKey) ?? 0n) + amount
      // branch in applyDelta — a second debt for the same pair must add to
      // the existing entry, not create a duplicate or reset it.
      const expenses = [
        {
          payerId: "alice",
          splits: [{ userId: "bob", amount: 10000n }], // bob owes alice 100
        },
        {
          payerId: "alice",
          splits: [{ userId: "bob", amount: 20000n }], // bob owes alice 200
        },
      ];

      const result = computeBalances({ expenses, settlements: [] });

      expect(result).toHaveLength(1);
      const balance = findBalance(result, "bob", "alice");
      expect(balance).toBeDefined();
      expect(balance.amount).toBe(30000n); // 100 + 200 = 300
    });
  });

  describe("Multiple payers", () => {
    test("nets opposing debts when both parties have paid for each other", () => {
      const expenses = [
        {
          payerId: "alice",
          splits: [
            { userId: "alice", amount: 5000n },
            { userId: "bob",   amount: 5000n },
          ],
        },
        {
          payerId: "bob",
          splits: [
            { userId: "alice", amount: 3000n },
            { userId: "bob",   amount: 3000n },
          ],
        },
      ];

      // bob→alice 5000, alice→bob 3000 → net bob→alice 2000
      const result = computeBalances({ expenses, settlements: [] });

      expect(result).toHaveLength(1);
      const balance = findBalance(result, "bob", "alice");
      expect(balance).toBeDefined();
      expect(balance.amount).toBe(2000n);
    });
  });

  describe("Reverse pair cancellation", () => {
    test("equal opposing debts between the same pair cancel to zero", () => {
      const expenses = [
        {
          payerId: "alice",
          splits: [
            { userId: "alice", amount: 5000n },
            { userId: "bob",   amount: 5000n },
          ],
        },
        {
          payerId: "bob",
          splits: [
            { userId: "alice", amount: 5000n },
            { userId: "bob",   amount: 5000n },
          ],
        },
      ];

      const result = computeBalances({ expenses, settlements: [] });

      expect(result).toHaveLength(0);
    });
  });

  describe("Direction flip", () => {
    test("flips debtor and creditor when the counter-debt exceeds the original debt", () => {
      const expenses = [
        {
          payerId: "alice",
          splits: [
            { userId: "alice", amount: 5000n },
            { userId: "bob",   amount: 5000n },
          ],
        },
        {
          payerId: "bob",
          splits: [
            { userId: "alice", amount: 8000n },
            { userId: "bob",   amount: 2000n },
          ],
        },
      ];

      // bob→alice 5000, alice→bob 8000 → net alice→bob 3000
      const result = computeBalances({ expenses, settlements: [] });

      expect(result).toHaveLength(1);
      const aliceBob = findBalance(result, "alice", "bob");
      expect(aliceBob).toBeDefined();
      expect(aliceBob.amount).toBe(3000n);
      expect(findBalance(result, "bob", "alice")).toBeUndefined();
    });
  });

  describe("Three-person cycle", () => {
    test("preserves all three cycle edges without simplification", () => {
      // alice owes bob, bob owes charlie, charlie owes alice — engine does not reduce cycles
      const expenses = [
        { payerId: "bob",     splits: [{ userId: "alice",   amount: 10000n }] },
        { payerId: "charlie", splits: [{ userId: "bob",     amount: 10000n }] },
        { payerId: "alice",   splits: [{ userId: "charlie", amount: 10000n }] },
      ];

      const result = computeBalances({ expenses, settlements: [] });

      expect(result).toHaveLength(3);

      const aliceBob = findBalance(result, "alice", "bob");
      expect(aliceBob).toBeDefined();
      expect(aliceBob.amount).toBe(10000n);

      const bobCharlie = findBalance(result, "bob", "charlie");
      expect(bobCharlie).toBeDefined();
      expect(bobCharlie.amount).toBe(10000n);

      const charlieAlice = findBalance(result, "charlie", "alice");
      expect(charlieAlice).toBeDefined();
      expect(charlieAlice.amount).toBe(10000n);
    });
  });

  describe("Four-person group", () => {
    test("tracks all pairwise balances correctly across two expenses and four participants", () => {
      const expenses = [
        {
          payerId: "alice",
          splits: [
            { userId: "alice",   amount: 5000n },
            { userId: "bob",     amount: 5000n },
            { userId: "charlie", amount: 5000n },
            { userId: "diana",   amount: 5000n },
          ],
        },
        {
          payerId: "bob",
          splits: [
            { userId: "alice",   amount: 4000n },
            { userId: "bob",     amount: 4000n },
            { userId: "charlie", amount: 4000n },
            { userId: "diana",   amount: 4000n },
          ],
        },
      ];

      // bob→alice 5000 nets against alice→bob 4000 → bob→alice 1000
      const result = computeBalances({ expenses, settlements: [] });

      const bobAlice = findBalance(result, "bob", "alice");
      expect(bobAlice).toBeDefined();
      expect(bobAlice.amount).toBe(1000n);

      const charlieAlice = findBalance(result, "charlie", "alice");
      expect(charlieAlice).toBeDefined();
      expect(charlieAlice.amount).toBe(5000n);

      const charlieBob = findBalance(result, "charlie", "bob");
      expect(charlieBob).toBeDefined();
      expect(charlieBob.amount).toBe(4000n);

      const dianaAlice = findBalance(result, "diana", "alice");
      expect(dianaAlice).toBeDefined();
      expect(dianaAlice.amount).toBe(5000n);

      const dianaBob = findBalance(result, "diana", "bob");
      expect(dianaBob).toBeDefined();
      expect(dianaBob.amount).toBe(4000n);
    });
  });

  describe("Large BigInt amounts", () => {
    test("handles very large paise values without overflow", () => {
      const expenses = [
        {
          payerId: "alice",
          splits: [{ userId: "bob", amount: 500000000000n }],
        },
      ];

      const result = computeBalances({ expenses, settlements: [] });

      const balance = findBalance(result, "bob", "alice");
      expect(balance).toBeDefined();
      expect(balance.amount).toBe(500000000000n);
    });

    test("correctly nets two large opposing BigInt amounts down to a 1n remainder", () => {
      const expenses = [
        { payerId: "alice", splits: [{ userId: "bob",   amount: 999999999999n }] },
        { payerId: "bob",   splits: [{ userId: "alice", amount: 999999999998n }] },
      ];

      const result = computeBalances({ expenses, settlements: [] });

      expect(result).toHaveLength(1);
      const balance = findBalance(result, "bob", "alice");
      expect(balance).toBeDefined();
      expect(balance.amount).toBe(1n);
    });
  });

  describe("Expense deletion", () => {
    test("only expenses passed in are counted — deleted expenses excluded by the caller are invisible to the engine", () => {
      // computeGroupBalances filters deletedAt: null before calling computeBalances.
      // This verifies the engine is pure: it only sees what it receives.
      const expenses = [
        {
          payerId: "alice",
          splits: [
            { userId: "alice", amount: 5000n },
            { userId: "bob",   amount: 5000n },
          ],
        },
        // second expense intentionally omitted to simulate deletion
      ];

      const result = computeBalances({ expenses, settlements: [] });

      expect(result).toHaveLength(1);
      const balance = findBalance(result, "bob", "alice");
      expect(balance).toBeDefined();
      expect(balance.amount).toBe(5000n);
    });
  });

  describe("Partial settlement", () => {
    test("reduces the outstanding balance without eliminating it", () => {
      const expenses = [
        {
          payerId: "alice",
          splits: [
            { userId: "alice", amount: 15000n },
            { userId: "bob",   amount: 15000n },
          ],
        },
      ];
      const settlements = [{ fromUserId: "bob", toUserId: "alice", amount: 10000n }];

      const result = computeBalances({ expenses, settlements });

      expect(result).toHaveLength(1);
      const balance = findBalance(result, "bob", "alice");
      expect(balance).toBeDefined();
      expect(balance.amount).toBe(5000n);
    });
  });

  describe("Full settlement", () => {
    test("eliminates the balance when the settlement exactly matches the outstanding amount", () => {
      const expenses = [
        {
          payerId: "alice",
          splits: [
            { userId: "alice", amount: 15000n },
            { userId: "bob",   amount: 15000n },
          ],
        },
      ];
      const settlements = [{ fromUserId: "bob", toUserId: "alice", amount: 15000n }];

      const result = computeBalances({ expenses, settlements });

      expect(result).toHaveLength(0);
    });
  });

  describe("Settlement reducing debt", () => {
    test("multiple partial settlements compound to progressively reduce debt", () => {
      const expenses = [
        {
          payerId: "alice",
          splits: [
            { userId: "alice", amount: 10000n },
            { userId: "bob",   amount: 30000n },
          ],
        },
      ];
      const settlements = [
        { fromUserId: "bob", toUserId: "alice", amount: 10000n },
        { fromUserId: "bob", toUserId: "alice", amount: 10000n },
      ];

      const result = computeBalances({ expenses, settlements });

      expect(result).toHaveLength(1);
      const balance = findBalance(result, "bob", "alice");
      expect(balance).toBeDefined();
      expect(balance.amount).toBe(10000n);
    });
  });

  describe("Settlement eliminating debt", () => {
    test("a single settlement clears debt accumulated across multiple expenses", () => {
      const expenses = [
        {
          payerId: "alice",
          splits: [
            { userId: "alice", amount: 5000n },
            { userId: "bob",   amount: 5000n },
          ],
        },
        {
          payerId: "alice",
          splits: [
            { userId: "alice", amount: 5000n },
            { userId: "bob",   amount: 5000n },
          ],
        },
      ];
      const settlements = [{ fromUserId: "bob", toUserId: "alice", amount: 10000n }];

      const result = computeBalances({ expenses, settlements });

      expect(result).toHaveLength(0);
    });
  });
});
