# Ledgerline

A financial analytics dashboard for tracking company transactions. It has JWT login, a filterable, sortable and searchable transaction table, revenue and expense charts, and a configurable CSV export.

This is a hiring assignment. The brief is in `docs/assignment.pdf`, the build plan in [docs/PLAN.md](docs/PLAN.md), and the endpoint reference in [docs/API.md](docs/API.md).

## Status

| Phase                                                                  | State   |
| ---------------------------------------------------------------------- | ------- |
| 1. Scaffold: workspaces, tooling, Express app, health check, tests     | Done    |
| 2. Models, indexes and seed script                                     | Done    |
| 3. Auth (JWT)                                                          | Done    |
| 4. Transactions API (filter, search, sort, paginate)                   | Done    |
| 5. Analytics API                                                       | Pending |
| 6. CSV export API                                                      | Pending |
| 7–10. Frontend: foundation, dashboard, table and filters, export modal | Pending |
| 11. Final pass                                                         | Pending |

## Tech stack

- **client/**: React 19, TypeScript, Vite. MUI, Recharts, TanStack Query, React Router and axios arrive in Phase 7.
- **server/**: Node, Express 5, TypeScript, Mongoose, zod, jsonwebtoken, bcryptjs, express-rate-limit, helmet, cors.
- **Database**: MongoDB 5.0 or later (Atlas free tier or local).
- **Tests**: Vitest and Supertest, against an in-memory MongoDB.

## Prerequisites

- **Node.js 20.19 or later.** Node 22 LTS is recommended. Mongoose 9, ESLint 10 and Vite 8 all need at least 20.19.
- **npm 10 or later.** The repo uses npm workspaces.
- **A MongoDB connection string.** Atlas is used during development, but any MongoDB 5.0+ URI works.

## Getting started

```bash
# 1. Install both workspaces from the repo root
npm install

# 2. Create the server's environment file, then set MONGODB_URI, JWT_SECRET and the DEMO_USER_* values
cp server/.env.example server/.env        # PowerShell: Copy-Item server/.env.example server/.env

# 3. Load the 300 sample transactions and create the demo login
npm run seed

# 4. Start the API (port 4000) and the client (port 5173) together
npm run dev
```

Open http://localhost:5173. To check that the API can reach the database, open http://localhost:5173/api/health. It should return `{"status":"ok","db":"connected"}`.

**Atlas:** add your IP address under _Network Access_, or the server and seed exit after 10 seconds with a `MongooseServerSelectionError`.

## Scripts

Run these from the repo root.

| Command                   | What it does                                                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run dev`             | API with auto-restart (tsx watch) and the Vite client, side by side                                                                  |
| `npm run seed`            | Loads `server/data/transactions.json` and the demo user. Safe to repeat; see [Seeding](#seeding)                                     |
| `npm run seed -- --reset` | Deletes all transactions first, then seeds. Users are kept                                                                           |
| `npm run build`           | Compiles the server to `server/dist` and bundles the client                                                                          |
| `npm run lint`            | ESLint (type-aware rules) in both workspaces                                                                                         |
| `npm run typecheck`       | `tsc` in both workspaces                                                                                                             |
| `npm test`                | Server test suite (unit and integration). **The first run downloads MongoDB for the tests (about 780 MB, one time, a few minutes).** |
| `npm run format`          | Formats the repo with Prettier                                                                                                       |
| `npm run format:check`    | Fails if any file isn't formatted                                                                                                    |

## Environment variables (`server/.env`)

| Variable             | Required  | Default                 | Purpose                                                            |
| -------------------- | --------- | ----------------------- | ------------------------------------------------------------------ |
| `MONGODB_URI`        | Yes       | –                       | `mongodb://` or `mongodb+srv://` URI; its path names the database  |
| `PORT`               | No        | `4000`                  | API port (the Vite proxy expects 4000)                             |
| `CLIENT_ORIGIN`      | No        | `http://localhost:5173` | The only origin CORS allows                                        |
| `NODE_ENV`           | No        | `development`           | `development`, `test` or `production`                              |
| `JWT_SECRET`         | Yes       | –                       | Signs login tokens. At least 32 characters (command below)         |
| `JWT_EXPIRES_IN`     | No        | `8h`                    | Token lifetime: a whole number plus `s`, `m`, `h` or `d`           |
| `DEMO_USER_EMAIL`    | Seed only | –                       | Login email of the demo user the seed creates                      |
| `DEMO_USER_PASSWORD` | Seed only | –                       | Its password (at least 8 characters). Stored only as a bcrypt hash |
| `DEMO_USER_NAME`     | Seed only | –                       | Display name                                                       |

Generate a `JWT_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

The server and the seed both validate their environment on startup and list every missing or invalid variable before exiting.

## Authentication

Log in with the demo user from `server/.env`: `POST /api/auth/login` returns a token, and every protected endpoint expects it in an `Authorization: Bearer <token>` header. The full request and response reference, with curl and PowerShell examples, is in [docs/API.md](docs/API.md#post-apiauthlogin).

- **Tokens** are HS256 JWTs that expire after `JWT_EXPIRES_IN` (8 hours by default). The only claim is the user id. The server verifies with the algorithm pinned to HS256, so `alg: none` and algorithm-swap tokens are rejected.
- **Each request looks the user up**, so deleting a user revokes their tokens immediately. An expired token gets `TOKEN_EXPIRED`, which is distinct from `UNAUTHORIZED`, so the client can say "session expired" instead of a generic error.
- **Failed logins don't reveal which emails exist.** An unknown email and a wrong password get the same 401 message. Both also take the same time, because an unknown email is still checked against a dummy bcrypt hash.
- **Rate limit:** 10 failed logins per 15 minutes per IP address. Only failures count (`skipSuccessfulRequests`), so a correct password is never locked out by earlier successful logins.
- **Logout is client-side.** The client discards the token; the server keeps no session. Real server-side logout would need a denylist of token ids checked on every request. [auth.routes.ts](server/src/routes/auth.routes.ts) explains what that would take and why it isn't worth it for an 8-hour token here.

## Filtering, search and sorting

`GET /api/transactions` does all filtering, searching, sorting and paging in MongoDB. The browser never downloads rows just to filter them. The parameters are documented in [docs/API.md](docs/API.md#filters). The design choices behind them:

- **One query builder.** `buildTransactionQuery()` in [server/src/queries/](server/src/queries/buildTransactionQuery.ts) is a pure function from validated filters to a Mongo query. The list endpoint uses it now, and the analytics and export endpoints will too, so a filter can't mean one thing in the table and another in a chart or a CSV. It has full unit-test coverage.
- **One filter schema** validates both query strings (`statuses=Paid,Pending`) and JSON bodies (`["Paid", "Pending"]`). It rejects unknown parameters, so a typo like `statuss=Paid` is a 400, not silently unfiltered data. It also rejects backwards ranges (`dateFrom` after `dateTo`).
- **Dates are UTC days, inclusive.** `dateTo=2024-03-31` includes the whole of 31 March, because the bound is "before 1 April 00:00 UTC".
- **Search** is a case-insensitive "contains" match on user, category and status. A number also matches an exact id or amount (`1,500.50` works). Input is regex-escaped, so `.*` matches the literal text rather than every row, and a pattern can't be crafted to run slowly.
- **Sorting** is limited to a whitelist of fields. Ties are broken by `id`, so paging through a sort with many equal values never repeats or skips a row.

## Seeding

`npm run seed` runs these steps:

1. Validates every row of `server/data/transactions.json` with zod: types, enums, ISO dates, no duplicate ids. It stops before touching the database if any row is bad, and names the row and field.
2. Syncs indexes on both collections, so they match the schemas exactly.
3. Upserts transactions by their numeric `id`, storing `date` as a real `Date`.
4. Upserts the demo user from the `DEMO_USER_*` variables, with the password hashed by bcrypt.
5. Prints a summary and checks it against the known totals of the data file.

Running it again changes nothing. Rows that already match are left alone. The demo user is only rewritten if its name or password in `.env` has changed: bcrypt salts every hash, so the script compares the password rather than re-hashing it each run.

`--reset` deletes all **transactions** before seeding. **Users are kept on purpose**, so a reset during development doesn't log you out. The demo user can't go stale, because every run upserts it from `.env` anyway.

A second run prints:

```
Ledgerline seed: database "finance_dashboard" on <your-cluster-host>
Mode: upsert (pass --reset to wipe transactions first)

Transactions  300 in file: 0 inserted, 0 updated, 300 unchanged
Indexes       7 on transactions, 2 on users (in sync)
Demo user     analyst@example.com: unchanged

Summary
  Rows        300
  Date range  2024-01-02 to 2024-12-23 (UTC)
  Revenue     339,803.25
  Expense     206,605.00
  Pending     205,303.00 (114 rows)

OK: all totals match the expected values.
```

Exit codes:

- **0**: the totals match.
- **1**: the totals don't match, or the data file, environment or connection is invalid. The report lists each figure that differs. The usual cause is extra rows already in the collection, which `--reset` fixes.

## Data model and indexes

**`transactions`**:

- `id` (number, unique; the source id, kept separate from Mongo's `_id`).
- `date` (Date).
- `amount` (number, always positive).
- `category` (`Revenue` | `Expense`).
- `status` (`Paid` | `Pending`).
- `user_id`, `user_profile` (strings).

**`users`**: `email` (unique, stored lowercase), `passwordHash` (never returned by queries unless explicitly selected), `name`.

| Index                                    | Query it serves                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| `transactions { id: 1 }` unique          | Seed upserts by id; a numeric search term matches id exactly                             |
| `transactions { date: -1, id: -1 }`      | Default list sort (newest first, id breaks ties); "Latest 5 overall"; date-range filters |
| `transactions { user_id: 1, date: -1 }`  | User filter with the default date sort                                                   |
| `transactions { status: 1, date: -1 }`   | Status filter with the default date sort; the Pending total                              |
| `transactions { category: 1, date: -1 }` | Category filter with the default date sort; revenue/expense totals and trend             |
| `transactions { amount: 1, id: 1 }`      | Amount range filter and amount sort                                                      |
| `users { email: 1 }` unique              | Login lookup                                                                             |

How these were chosen:

- **At 300 rows, any query is fast even without an index**, because MongoDB just reads every document. These indexes are sized for the same queries on a real ledger with millions of rows. At that scale, what matters most is avoiding a sort done in memory.
- **Filter field first, then `date`.** When a filter asks for an exact value (a user, a status, a category), that field leads the index and `date` follows. MongoDB can then jump straight to the matching rows and read them in date order, with no separate sort.
- **`category` and `status` never get an index of their own.** Each has only two values, so an index on one alone would still match about half the collection. Paired with `date`, it removes the sort.
- **`id` is added as a tiebreaker** to the date and amount indexes. Rows with equal dates or amounts then come back in the same order every time, so pages never overlap or skip rows.
- **Free-text search can't use an index.** It is a case-insensitive "contains" match, which can't use one. A text index would only match whole words (`user_00` wouldn't find `user_001`). At this data size a scan is the simpler, correct choice.

## Project structure

```
package.json         npm workspaces + root scripts
server/
  data/              transactions.json (seed source)
  scripts/seed/      seed CLI: validate, sync indexes, upsert, summarise, verify
  src/
    app.ts           builds the Express app (no listen), so tests can import it
    server.ts        connects to MongoDB, starts listening, shuts down cleanly
    config/          zod-validated environment
    constants/       shared enums (categories, statuses)
    models/          Mongoose schemas and indexes
    routes/ → controllers/ → services/   HTTP layer → request handling → business logic
    schemas/         zod request schemas (login, transaction filters and paging)
    queries/         buildTransactionQuery() and buildTransactionSort(): pure, shared by every data endpoint
    middleware/      requireAuth, login rate limit, central error handler, 404 handler
    types/           Express Request augmentation (req.user)
    errors/          AppError: the one error type that reaches clients
    utils/           logger, password hashing, durations, UTC days, regex escaping, money rounding, zod issue formatting
  tests/
    setup/           in-memory MongoDB, "_test" database guard
    unit/  integration/
client/
  src/               React app (placeholder until Phase 7)
  vite.config.ts     proxies /api to the server in development
docs/                plan, API reference, brief
```

## Error format

Every error response has the same shape, produced by one central handler:

```json
{ "error": { "code": "NOT_FOUND", "message": "Route GET /api/nope does not exist" } }
```

Validation errors add a `details` array of `{ path, message }`. Unexpected errors return a generic 500 message. The real error is logged on the server and never sent to the client. The full list of codes is in [docs/API.md](docs/API.md).

## Testing

`npm test` starts a throwaway in-memory MongoDB, so tests never touch Atlas or your local data. As a second safeguard, the test helper refuses to connect to any database whose name doesn't end in `_test`.

**The first `npm test` downloads a MongoDB binary** (about 780 MB on Windows, a few minutes). It is cached in `node_modules/.cache/mongodb-memory-server`, so later runs start in about a second. `npm install` never downloads it: only people who run the tests pay that cost.

## Technical decisions

- **Express 5.** Errors thrown in route handlers, including async ones, reach the error handler without wrapper functions.
- **TypeScript 6.0, not 7.** typescript-eslint, which provides the type-aware lint rules, supports TypeScript only up to 6.0.
- **Vitest 4 and concurrently 9.** Their newer majors dropped Node 20, which the project still supports.
- **`mongodb-memory-server-core`, not `mongodb-memory-server`.** It's the same library without the install hook. That keeps `npm install` fast and moves the MongoDB download to the first test run.
- **No dotenv.** Node's built-in `--env-file` flag loads `server/.env`, and `tsx watch` passes it through.
- **ESM throughout.** The server uses `"type": "module"` with `NodeNext` resolution, so relative imports end in `.js`.
