# Wallet Ledger Service

A ledger-based wallet microservice. Balance is always derived from the sum of ledger transactions — no stored balance column.

## Setup

Requires Node.js 18+ and PostgreSQL.

```bash
npm install
createdb wallet_ledger       # safe to skip if it already exists
cp .env.example .env         # set your PostgreSQL username
npm run prisma:migrate
npm run dev                  # http://localhost:3000
```

## Schema Design

The schema uses two tables, following the normalization approach:

- **LedgerEntry** — every financial event (credit or debit) is a row. Credits store a positive `amount`, debits store a negative `amount`, so the balance is simply `SUM(amount)`.
- **Purchase** — stores purchase-specific data (`itemId`, `priceAtPurchase`) with a 1:1 foreign key to its corresponding `LedgerEntry`. This keeps the ledger table generic while preserving the exact price used at the time of purchase, even if the item price changes later.

## Concurrency

Purchases use PostgreSQL advisory locks (`pg_advisory_xact_lock`) scoped to the user ID. Inside a serializable transaction, the lock ensures that all operations for a given user — reading the balance, checking it, and inserting the debit — happen atomically. A second concurrent purchase for the same user blocks until the first completes, so the balance can never go below zero. Concurrent requests for different users run fully in parallel with no contention.

## Database Indexes

- **`LedgerEntry(userId, amount)`** — composite covering index for the balance query (`SUM(amount) WHERE userId = ?`). PostgreSQL can compute the sum directly from the index leaf pages via an index-only scan, without touching the table heap. This is the hottest query in the system, so the extra write cost per insert is justified. A single-column `(userId)` index was intentionally omitted because the composite already supports `userId`-only lookups as its leading column.
- **`Purchase(userId)`** — supports purchase history lookups by user. Minimal write cost since purchases are less frequent than balance reads.
- **`Purchase(ledgerEntryId)`** — unique index enforcing the 1:1 relationship between a purchase and its ledger entry. Required by the foreign key constraint.

## Idempotency

To support idempotency on `POST /api/purchases`, I would add an `IdempotencyKey` table with columns: `key` (unique), `userId`, `statusCode`, `responseBody`, and `createdAt`. The unique constraint on `key` would be scoped per user via a composite unique index on `(userId, key)`, so different users can independently use the same key string. On each request carrying an `x-idempotency-key` header, the server checks the table first — if a matching record exists for that key and user, it replays the stored response (including non-2xx results) without re-executing the purchase. If no record exists, the purchase proceeds inside a transaction that also inserts the idempotency record atomically. The unique constraint handles races: if two identical requests arrive simultaneously, only one succeeds at inserting the record — the other catches the unique-violation error and returns the winner's stored result. Keys would have a TTL (e.g. 24 hours) enforced by a periodic cleanup job, since idempotency guarantees are only meaningful within a reasonable time window. Expired keys would be deleted in batches to avoid locking the table during cleanup.
