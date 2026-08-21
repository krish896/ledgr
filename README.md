# Ledgr

A production-inspired group expense splitting application built around an append-only ledger architecture.

---

## Features

- **JWT Authentication** — register, login, profile management via HTTP-only cookies
- **Groups** — create groups, add members, view per-group balances
- **Expense Splitting** — equal split with deterministic remainder distribution, or exact per-member amounts
- **Dynamic Balance Engine** — balances are recomputed on read from the immutable ledger; never cached
- **Debt Simplification** — optional greedy algorithm reduces N pairwise debts to the minimum number of transfers
- **Settlements** — record payments that reduce outstanding balances
- **Receipt OCR** — upload a receipt image; Claude Vision extracts description, amount, and date as an expense draft
- **Audit Log** — every mutation records a before/after JSONB snapshot to a polymorphic audit table
- **UPI Deep Links** — generate a `upi://pay` deep link to settle a balance directly via any UPI app

---

## Tech Stack

### Backend

- Node.js + Express 5
- PostgreSQL 16 + Prisma v6
- JWT in HTTP-only cookies
- bcryptjs, multer, zod, `@anthropic-ai/sdk`

### Frontend

- React + Vite + Tailwind CSS
- React Router DOM

---

## Core Architecture

| Principle | Detail |
|---|---|
| Append-only ledger | Expenses and settlements are immutable once created; corrections are new entries |
| Recompute-on-read balances | No cached balance columns — balances fold the full ledger on every request |
| BIGINT paise | All money stored as integer paise (1 INR = 100 paise); no floats anywhere in the money path |
| Transactional writes | All multi-row mutations go through `prisma.$transaction` |
| Polymorphic audit log | Every mutation writes entity_type + entity_id + before/after JSONB snapshot |
| Partial unique index | GroupMember active-membership enforced by a `WHERE "removedAt" IS NULL` index (raw SQL migration) |

---

## Database Schema

7 tables: `User`, `Group`, `GroupMember`, `Expense`, `ExpenseSplit`, `Settlement`, `AuditLog`.

```
User ──< GroupMember >── Group
                          │
                    Expense (+ ExpenseSplit)
                    Settlement
                    AuditLog
```

---

## API Endpoints

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Register (email, password, optional name) |
| POST | `/auth/login` | Login — sets JWT cookie |
| POST | `/auth/logout` | Clear JWT cookie |
| GET | `/auth/me` | Current user profile |
| PATCH | `/auth/me` | Update name or UPI ID |

### Groups
| Method | Path | Description |
|---|---|---|
| POST | `/groups` | Create a group |
| GET | `/groups` | List groups for current user |
| GET | `/groups/:groupId` | Group detail + members |
| PATCH | `/groups/:groupId` | Update group name |
| POST | `/groups/:groupId/members` | Add a member |
| GET | `/groups/:groupId/balances` | Pairwise balances (`?simplified=true` for debt simplification) |
| POST | `/groups/:groupId/upi-link` | Generate a UPI deep link to settle a balance |

### Expenses
| Method | Path | Description |
|---|---|---|
| POST | `/groups/:groupId/expenses` | Create an expense |
| GET | `/groups/:groupId/expenses/:expenseId` | Expense detail |
| DELETE | `/groups/:groupId/expenses/:expenseId` | Soft-delete an expense |
| POST | `/groups/:groupId/expenses/receipts` | Upload a receipt image |
| GET | `/groups/:groupId/expenses/receipts/:filename` | Retrieve a receipt image |
| POST | `/groups/:groupId/expenses/ocr` | Run OCR on an uploaded receipt |

### Settlements
| Method | Path | Description |
|---|---|---|
| POST | `/groups/:groupId/settlements` | Record a settlement payment |
| GET | `/groups/:groupId/settlements` | List settlements for a group |

---

## Interesting Engineering Decisions

- **BIGINT paise** — avoids all floating-point rounding issues; UI converts to rupees only at the display boundary
- **Deterministic remainder distribution** — equal splits assign leftover paise to members in stable ID order, so totals always reconcile exactly
- **Recompute-on-read balances** — zero denormalization risk; balances are always consistent with the ledger
- **Greedy debt simplification** — O(n²) max-creditor/max-debtor matching reduces transfer count; display-only, never affects settlement recording
- **Partial unique index** — Prisma cannot express `WHERE removedAt IS NULL`; enforced via raw SQL migration + P2002 error handling in the service layer
- **JSONB audit snapshots** — before/after state captured on every mutation; polymorphic entity_type + entity_id covers all tables with one log table
- **Vite proxy** — frontend requests go to `/api/*` on the same origin; Vite forwards them to the backend, keeping `sameSite: lax` cookies working without CORS configuration
- **Lazy OCR key check** — `ANTHROPIC_API_KEY` is validated at invocation time (503 if absent), not at startup, so the server boots without a key in development

---

## Local Development

### Prerequisites

- Node.js 20+
- PostgreSQL 16
- (Optional) `ANTHROPIC_API_KEY` for live OCR; set `OCR_MOCK=true` to bypass

### Backend

```bash
cd backend
cp .env.example .env       # fill in DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate deploy
npm run dev                # http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                # http://localhost:5173 (proxies /api/* to :3000)
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | No | Token lifetime (default: `7d`) |
| `ANTHROPIC_API_KEY` | No | Required for live OCR |
| `OCR_MOCK` | No | Set to `true` to skip real OCR in development |

### Tests

```bash
cd backend
npm test
```

---

## Deployment

- Frontend → Vercel
- Backend → Railway
- Database → Railway PostgreSQL
