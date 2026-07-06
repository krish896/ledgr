# Ledgr

Expense-splitting app framed as a financial ledger. Placement portfolio piece.

## Stack

- Backend: Node + Express, PostgreSQL 16, Prisma v6
- Frontend: React + Vite + Tailwind
- Auth: JWT (access + refresh)
- Money: BIGINT paise (never floats). Deterministic remainder distribution.

## Architectural invariants — DO NOT VIOLATE

- **Append-only ledger.** Expenses and settlements are immutable once created. Corrections are new entries, not edits.
- **Recompute-on-read balances.** No cached balance columns. Balances come from folding the ledger.
- **All money is BIGINT paise.** No Float, no Decimal in code paths that touch money. UI conversion only at the boundary.
- **All multi-row writes go through `prisma.$transaction`.** No exceptions.
- **Audit log gets a JSONB snapshot for every mutation.** Polymorphic entity_type + entity_id.

## Schema

7 tables: User, Group, GroupMember, Expense, ExpenseSplit, Settlement, AuditLog.
GroupMember has a partial unique index on (group_id, user_id) where deleted_at IS NULL — applied via raw SQL migration.

## Layout

- `prisma/` — schema, migrations
- `src/routes/` — Express routers
- `src/services/` — business logic
- `src/lib/` — pure functions (debt simplification lives here, no endpoint)
- `src/middleware/` — auth, error handling
- `client/` — React app

## Commands

- Dev server: `npm run dev`
- Prisma migrate: `npx prisma migrate dev --name <name>`
- Prisma studio: `npx prisma studio`
- Tests: `npm test`

## Style

- ES modules, async/await, no callbacks.
- Errors: throw typed errors from services, catch in a single Express error middleware.
- No `any` in TS files (if/when TS is introduced).
- Prisma queries stay in services, never in routes.

## What NOT to do

- Don't cache balances anywhere.
- Don't add new endpoints without asking.
- Don't touch migrations that are already applied — write a new one.
- Don't install new dependencies without asking.
