'use strict';

/**
 * Unit tests for getGroupExpenses service function.
 *
 * HTTP-layer test (401 on missing cookie) is enforced by the authenticate
 * middleware mounted in app.js and is not duplicated here. All 10 scenarios
 * from the test plan are covered below.
 */

const NotFoundError = require('../src/errors/NotFoundError');

jest.mock('../src/lib/prisma', () => ({
  expense: { findMany: jest.fn() },
}));

jest.mock('../src/lib/groupMembership', () => ({
  ensureActiveMember: jest.fn(),
}));

const prisma = require('../src/lib/prisma');
const { ensureActiveMember } = require('../src/lib/groupMembership');
const { getGroupExpenses } = require('../src/services/expense.service');

const GROUP_ID = 'group-abc';
const ACTOR    = { userId: 'user-1' };
const ACTOR_2  = { userId: 'user-2' };

function makeRow(overrides = {}) {
  return {
    id:              'exp-1',
    groupId:         GROUP_ID,
    payerId:         'user-1',
    amount:          BigInt(50000),
    description:     'Dinner',
    splitType:       'EQUAL',
    occurredAt:      new Date('2025-08-20T12:00:00Z'),
    receiptImageUrl: null,
    createdAt:       new Date('2025-08-20T12:00:00Z'),
    payer:           { id: 'user-1', name: 'Krish', email: 'krish@example.com' },
    splits:          [{ userId: 'user-1' }, { userId: 'user-2' }],
    ...overrides,
  };
}

beforeEach(() => jest.clearAllMocks());

// ── Plan item 1: no auth ──────────────────────────────────────────────────────
// Covered by the authenticate middleware in app.js (returns 401 before the
// service is ever called). Not duplicated here.

// ── Plan item 2 & 8: non-member / nonexistent group ──────────────────────────
describe('authorization', () => {
  test('throws NotFoundError when caller is not an active group member', async () => {
    ensureActiveMember.mockRejectedValue(new NotFoundError('Group not found'));
    await expect(getGroupExpenses(GROUP_ID, ACTOR)).rejects.toBeInstanceOf(NotFoundError);
    expect(prisma.expense.findMany).not.toHaveBeenCalled();
  });

  test('throws NotFoundError for a nonexistent groupId', async () => {
    ensureActiveMember.mockRejectedValue(new NotFoundError('Group not found'));
    await expect(getGroupExpenses('nonexistent', ACTOR)).rejects.toMatchObject({
      message: 'Group not found',
    });
  });

  test('calls ensureActiveMember before querying the database', async () => {
    const order = [];
    ensureActiveMember.mockImplementation(() => { order.push('auth'); return Promise.resolve({}); });
    prisma.expense.findMany.mockImplementation(() => { order.push('db'); return Promise.resolve([]); });
    await getGroupExpenses(GROUP_ID, ACTOR);
    expect(order).toEqual(['auth', 'db']);
  });
});

// ── Plan item 3: empty list ───────────────────────────────────────────────────
describe('empty group', () => {
  test('returns { expenses: [] } when the group has no active expenses', async () => {
    ensureActiveMember.mockResolvedValue({});
    prisma.expense.findMany.mockResolvedValue([]);
    const result = await getGroupExpenses(GROUP_ID, ACTOR);
    expect(result).toEqual({ expenses: [] });
  });
});

// ── Plan item 3 (query shape) ─────────────────────────────────────────────────
describe('prisma query', () => {
  test('filters by groupId and deletedAt: null, orders by occurredAt desc', async () => {
    ensureActiveMember.mockResolvedValue({});
    prisma.expense.findMany.mockResolvedValue([]);
    await getGroupExpenses(GROUP_ID, ACTOR);
    expect(prisma.expense.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where:   { groupId: GROUP_ID, deletedAt: null },
        orderBy: { occurredAt: 'desc' },
      })
    );
  });

  test('includes only userId from splits (no amounts leaked)', async () => {
    ensureActiveMember.mockResolvedValue({});
    prisma.expense.findMany.mockResolvedValue([]);
    await getGroupExpenses(GROUP_ID, ACTOR);
    expect(prisma.expense.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          splits: { select: { userId: true } },
        }),
      })
    );
  });
});

// ── Plan item 4: response shape (payer + participantIds) ─────────────────────
describe('response shape', () => {
  test('maps payer object and participantIds from splits', async () => {
    ensureActiveMember.mockResolvedValue({});
    prisma.expense.findMany.mockResolvedValue([makeRow()]);
    const { expenses } = await getGroupExpenses(GROUP_ID, ACTOR);
    expect(expenses).toHaveLength(1);
    expect(expenses[0]).toMatchObject({
      id:              'exp-1',
      groupId:         GROUP_ID,
      payerId:         'user-1',
      amount:          BigInt(50000),
      description:     'Dinner',
      splitType:       'EQUAL',
      receiptImageUrl: null,
      payer:           { id: 'user-1', name: 'Krish', email: 'krish@example.com' },
      participantIds:  ['user-1', 'user-2'],
    });
  });

  test('does not expose raw splits array on response items', async () => {
    ensureActiveMember.mockResolvedValue({});
    prisma.expense.findMany.mockResolvedValue([makeRow()]);
    const { expenses } = await getGroupExpenses(GROUP_ID, ACTOR);
    expect(expenses[0]).not.toHaveProperty('splits');
  });

  test('includes receiptImageUrl (null or string) on each row', async () => {
    ensureActiveMember.mockResolvedValue({});
    const withReceipt = makeRow({ receiptImageUrl: 'https://cdn.example.com/r.jpg' });
    prisma.expense.findMany.mockResolvedValue([withReceipt]);
    const { expenses } = await getGroupExpenses(GROUP_ID, ACTOR);
    expect(expenses[0].receiptImageUrl).toBe('https://cdn.example.com/r.jpg');
  });
});

// ── Plan item 5: ordering ─────────────────────────────────────────────────────
describe('ordering', () => {
  test('preserves the desc-occurredAt order returned by prisma', async () => {
    ensureActiveMember.mockResolvedValue({});
    const newer = makeRow({ id: 'exp-2', occurredAt: new Date('2025-08-22T00:00:00Z') });
    const older = makeRow({ id: 'exp-1', occurredAt: new Date('2025-08-20T00:00:00Z') });
    prisma.expense.findMany.mockResolvedValue([newer, older]);
    const { expenses } = await getGroupExpenses(GROUP_ID, ACTOR);
    expect(expenses[0].id).toBe('exp-2');
    expect(expenses[1].id).toBe('exp-1');
  });
});

// ── Plan item 6: EXACT split type ────────────────────────────────────────────
describe('EXACT split', () => {
  test('returns EXACT expenses with correct participantIds from splits', async () => {
    ensureActiveMember.mockResolvedValue({});
    const exact = makeRow({
      splitType: 'EXACT',
      splits:    [{ userId: 'user-1' }, { userId: 'user-2' }, { userId: 'user-3' }],
    });
    prisma.expense.findMany.mockResolvedValue([exact]);
    const { expenses } = await getGroupExpenses(GROUP_ID, ACTOR);
    expect(expenses[0].splitType).toBe('EXACT');
    expect(expenses[0].participantIds).toEqual(['user-1', 'user-2', 'user-3']);
  });
});

// ── Plan item 7: soft-deleted expenses excluded ───────────────────────────────
describe('soft-delete filter', () => {
  test('deletedAt: null is in the where clause so soft-deleted rows are excluded', async () => {
    ensureActiveMember.mockResolvedValue({});
    prisma.expense.findMany.mockResolvedValue([makeRow({ id: 'exp-active' })]);
    const { expenses } = await getGroupExpenses(GROUP_ID, ACTOR);
    expect(expenses).toHaveLength(1);
    expect(expenses[0].id).toBe('exp-active');
    expect(prisma.expense.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ deletedAt: null }) })
    );
  });
});

// ── Plan item 9: second group member ─────────────────────────────────────────
describe('any active member', () => {
  test('returns expense list for a second active group member', async () => {
    ensureActiveMember.mockResolvedValue({});
    prisma.expense.findMany.mockResolvedValue([makeRow()]);
    const { expenses } = await getGroupExpenses(GROUP_ID, ACTOR_2);
    expect(expenses).toHaveLength(1);
    expect(ensureActiveMember).toHaveBeenCalledWith(GROUP_ID, ACTOR_2.userId);
  });
});

// ── Plan item 10: participantIds type safety ──────────────────────────────────
describe('participantIds shape', () => {
  test('participantIds entries are strings (user IDs only, no amount fields)', async () => {
    ensureActiveMember.mockResolvedValue({});
    prisma.expense.findMany.mockResolvedValue([makeRow()]);
    const { expenses } = await getGroupExpenses(GROUP_ID, ACTOR);
    for (const id of expenses[0].participantIds) {
      expect(typeof id).toBe('string');
    }
  });
});
