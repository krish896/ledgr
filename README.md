# Ledgr

A production-inspired group expense splitting application built around an append-only ledger architecture.

---

## Features

- JWT Authentication
- Groups
- Equal Split
- Exact Split
- Dynamic Balance Engine
- Settlements
- OCR Receipt Itemization
- Audit Logs
- UPI Deep Links

---

## Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- Axios
- React Router DOM

### Backend

- Node.js
- Express
- Prisma ORM
- PostgreSQL
- JWT
- bcryptjs

---

## Core Architecture

- Append-only ledger
- Recompute-on-read balances
- Immutable settlements
- Transactional writes
- Polymorphic audit log

---

## Database

Database schema and ER diagram will be added here.

---

## Interesting Engineering Decisions

- BIGINT paise for money
- Deterministic equal split remainder distribution
- Partial unique index for group rejoin
- Greedy debt simplification
- JSONB audit snapshots
- Recompute-on-read balance engine

---

## Local Development

Coming soon.

---

## Deployment

- Frontend → Vercel
- Backend → Railway
- Database → Railway PostgreSQL

---

## Screenshots

Coming soon.
