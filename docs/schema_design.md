# Splitwise++ — Schema Reference

7 tables. All money in **BIGINT paise**. All primary keys are **CUID** strings.

## Table map

```
User ─┬─< GroupMember >─ Group
      ├─< Expense (payer) ──< ExpenseSplit
      ├─< Settlement (from/to)
      └─< AuditLog (actor)
```

---

## 1. User

| Column         | Type       | Notes                                                        |
|----------------|------------|--------------------------------------------------------------|
| `id`           | String     | PK, CUID                                                     |
| `email`        | String     | Unique, required                                             |
| `passwordHash` | String     | bcrypt, rounds=10. Never returned by API.                    |
| `name`         | String     | Display name, single field                                   |
| `upiId`        | String?    | Nullable, **indexed but NOT unique** (households share UPIs) |
| `createdAt`    | DateTime   | Auto                                                         |
| `updatedAt`    | DateTime   | Auto (`@updatedAt`)                                          |

**Why no username:** email is the login identity, `name` is the display. Username would be dead weight.
**Why upiId not unique:** family members may share one UPI. Real-world case beats default convention.

---

## 2. Group

| Column          | Type     | Notes                              |
|-----------------|----------|------------------------------------|
| `id`            | String   | PK, CUID                           |
| `name`          | String   | Required                           |
| `description`   | String?  | Nullable                           |
| `createdById`   | String   | FK → User.id. Group admin.         |
| `createdAt`     | DateTime | Auto                               |
| `updatedAt`     | DateTime | Auto                               |

**No `deletedAt`:** V1 has no delete-group flow. YAGNI.
**Authorization:** only `createdById` can add/remove members. Simple, no role table needed.

---

## 3. GroupMember (join table with history)

| Column       | Type       | Notes                                                       |
|--------------|------------|-------------------------------------------------------------|
| `id`         | String     | PK, CUID (surrogate — required because rejoin allowed)      |
| `groupId`    | String     | FK → Group.id                                               |
| `userId`     | String     | FK → User.id                                                |
| `removedAt`  | DateTime?  | NULL = active member. Timestamp = when removed.             |
| `createdAt`  | DateTime   | Auto (= join time; on rejoin, new row with new createdAt)   |
| `updatedAt`  | DateTime   | Auto                                                        |

### Critical: partial unique index

Prisma cannot express this. Raw SQL migration required:

```sql
CREATE UNIQUE INDEX group_member_active_unique
ON "GroupMember" ("groupId", "userId")
WHERE "removedAt" IS NULL;
```

**Effect:** enforces one active membership per (group, user), while historical (removed) rows can accumulate freely. Enables leave → rejoin.

**Why UPDATE `removedAt` instead of soft-delete + insert:** removal is a status transition, not a value change. The row's identity persists.

---

## 4. Expense

| Column         | Type              | Notes                                                    |
|----------------|-------------------|----------------------------------------------------------|
| `id`           | String            | PK, CUID                                                 |
| `groupId`      | String            | FK → Group.id                                            |
| `payerId`      | String            | FK → User.id                                             |
| `amount`       | BigInt            | Total in **paise**                                       |
| `description`  | String            | Required, human label                                    |
| `splitType`    | SplitType (enum)  | `EQUAL` \| `EXACT`                                       |
| `occurredAt`   | DateTime          | When it happened IRL. User-editable.                     |
| `deletedAt`    | DateTime?         | Soft-delete marker. NULL = active. Timestamp = replaced. |
| `createdAt`    | DateTime          | Auto (when the row was recorded)                         |
| `updatedAt`    | DateTime          | Auto                                                     |

**Prisma enum:**
```prisma
enum SplitType {
  EQUAL
  EXACT
}
```

**Edit flow:** `UPDATE Expense SET deletedAt = now()` on old row; INSERT new row with new values; INSERT new ExpenseSplit rows; INSERT AuditLog. All in one `prisma.$transaction`.

**No `ocrProcessed` flag:** OCR is a UI concern only. Image discarded after Claude vision call. DB doesn't care where the data came from.

**Balance queries filter `WHERE deletedAt IS NULL`.**

---

## 5. ExpenseSplit

| Column       | Type     | Notes                                    |
|--------------|----------|------------------------------------------|
| `id`         | String   | PK, CUID                                 |
| `expenseId`  | String   | FK → Expense.id, `onDelete: Cascade`     |
| `userId`     | String   | FK → User.id                             |
| `amount`     | BigInt   | This user's share in **paise**           |
| `createdAt`  | DateTime | Auto                                     |
| `updatedAt`  | DateTime | Auto                                     |

**No `deletedAt`:** cascades with parent Expense. Balance queries JOIN Expense and filter by `Expense.deletedAt IS NULL` — deleted expenses' splits automatically drop out.

**Deterministic remainder rule:** for EQUAL split of `N` paise across `M` members, the first `(N mod M)` members (sorted by userId ASC) get `+1` paise. Deterministic → same input, same output, always. Testable.

---

## 6. Settlement

| Column         | Type      | Notes                                             |
|----------------|-----------|---------------------------------------------------|
| `id`           | String    | PK, CUID                                          |
| `groupId`      | String    | FK → Group.id (balances are per-group)            |
| `fromUserId`   | String    | FK → User.id (sender)                             |
| `toUserId`     | String    | FK → User.id (receiver)                           |
| `amount`       | BigInt    | Paise                                             |
| `note`         | String?   | Optional user comment                             |
| `createdAt`    | DateTime  | Auto                                              |
| `updatedAt`    | DateTime  | Auto                                              |

**No `deletedAt`:** settlements are immutable. To reverse, insert a new row with `fromUserId` / `toUserId` swapped and same amount. Both rows exist. The math cancels out.

**Settlements do NOT reference expenses.** They target the net balance between users. Partial settlements, overpayments, and post-hoc expense edits all reconcile automatically via the balance projection.

---

## 7. AuditLog (polymorphic)

| Column        | Type            | Notes                                              |
|---------------|-----------------|----------------------------------------------------|
| `id`          | String          | PK, CUID                                           |
| `entityType`  | String          | `"Expense"` \| `"Settlement"` \| `"GroupMember"`   |
| `entityId`    | String          | ID of the row that was mutated                     |
| `actorId`     | String          | FK → User.id (who did it)                          |
| `action`      | AuditAction     | `CREATE` \| `UPDATE` \| `DELETE`                   |
| `before`      | Json?           | JSONB. NULL for CREATE.                            |
| `after`       | Json?           | JSONB. NULL for DELETE.                            |
| `createdAt`   | DateTime        | Auto                                               |

**Prisma enum:**
```prisma
enum AuditAction {
  CREATE
  UPDATE
  DELETE
}
```

**Composite index for lookups:**
```prisma
@@index([entityType, entityId])
```

**No `updatedAt`:** audit entries are immutable. Editing an audit log would defeat the purpose.

**Trade-off (interview talking point):** no FK integrity — `entityId` doesn't formally point to any table because the target varies. Gain: single uniform write path, single table to query, easy to add new entity types (just start writing rows with new `entityType`).

---

## Balance formula (the projection)

For user X in group G:

```
Balance(X, G) =
  + SUM(Expense.amount WHERE payerId = X AND groupId = G AND deletedAt IS NULL)
  − SUM(ExpenseSplit.amount WHERE userId = X, joined to Expense with groupId = G AND deletedAt IS NULL)
  + SUM(Settlement.amount WHERE fromUserId = X AND groupId = G)
  − SUM(Settlement.amount WHERE toUserId = X AND groupId = G)
```

Positive → X is owed money. Negative → X owes money. Sum across all members in a group = 0 (always).

Drop the `groupId` filter → global balance.

---

## Money handling

- All amounts stored as **`BigInt`** representing paise. Never floats, never Decimal.
- Add this once at Express entrypoint (before any route):
  ```js
  BigInt.prototype.toJSON = function () { return this.toString(); };
  ```
  Prevents `JSON.stringify` from throwing on BigInt.
- Helper module `lib/money.js`:
  ```js
  export const toPaise  = (rupees) => BigInt(Math.round(rupees * 100));
  export const fromPaise = (paise) => Number(paise) / 100;
  ```
- Deterministic split helper `lib/split.js` — write once, unit test, forget.

---

## Foreign key `onDelete` behavior (quick reference)

| From → To                        | onDelete   | Reason                                   |
|----------------------------------|------------|------------------------------------------|
| ExpenseSplit → Expense           | Cascade    | Splits have no life without parent       |
| Expense → Group                  | Restrict   | Group deletion not in scope anyway       |
| Expense → User (payer)           | Restrict   | Don't allow user delete if they paid     |
| Settlement → Group / User        | Restrict   | Same                                     |
| GroupMember → Group / User       | Restrict   | Same                                     |
| AuditLog → User (actor)          | Restrict   | Preserve audit history                   |

Practical note: in a 10-day portfolio project, you likely never delete Users or Groups anyway. `Restrict` is the safe default — the DB will error rather than silently cascade something you didn't intend.

---

## What we did NOT include (and why)

- **Category / tag** on Expense — not in PRD.
- **Currency** on Expense/Group — INR only, per PRD.
- **Recurring expenses** — not in scope.
- **`role` on GroupMember** — only creator has admin rights, checked via `Group.createdById`. Adding roles is a one-migration change if V2 needs it.
- **`receiptUrl` on Expense** — image discarded after OCR. No storage, no S3, no orphan blob cleanup.
- **Refresh tokens** — JWT only. Simplifies auth for portfolio scope.
- **`Balance` table** — balance is a projection, not stored state. Recomputed on read.

---

## Transaction discipline

Every mutation that touches multiple tables uses `prisma.$transaction`:

- **Create expense:** Expense INSERT + N × ExpenseSplit INSERT + AuditLog INSERT
- **Edit expense:** Expense UPDATE (deletedAt) + Expense INSERT + N × ExpenseSplit INSERT + AuditLog INSERT
- **Delete expense:** Expense UPDATE (deletedAt) + AuditLog INSERT
- **Create settlement:** Settlement INSERT + AuditLog INSERT
- **Reverse settlement:** Settlement INSERT (swapped) + AuditLog INSERT
- **Add member:** GroupMember INSERT + AuditLog INSERT
- **Remove member:** GroupMember UPDATE (removedAt) + AuditLog INSERT

If any step fails, the whole transaction rolls back. Audit log is always in the same transaction as the mutation it records — no drift possible.
