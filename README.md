# Ledgerline

A financial analytics dashboard for tracking company transactions. It has JWT login, a filterable, sortable and searchable transaction table, revenue and expense charts, and a configurable CSV export.

This is a hiring assignment. The brief is in `docs/assignment.pdf`, the build plan in [docs/PLAN.md](docs/PLAN.md), and the endpoint reference in [docs/API.md](docs/API.md).

## Status

| Phase                                                               | State   |
| ------------------------------------------------------------------- | ------- |
| 1. Scaffold: workspaces, tooling, Express app, health check, tests  | Done    |
| 2. Models, indexes and seed script                                  | Done    |
| 3. Auth (JWT)                                                       | Done    |
| 4. Transactions API (filter, search, sort, paginate)                | Done    |
| 5. Analytics API                                                    | Done    |
| 6. CSV export API                                                   | Done    |
| 7. Frontend foundation: theme, login, app shell, error chips        | Done    |
| 8. Dashboard: cards, overview chart, breakdown, latest transactions | Done    |
| 9. Transactions table, filters and search                           | Done    |
| 10. CSV export modal                                                | Pending |
| 11. Final pass                                                      | Pending |

## Tech stack

- **client/**: React 19, TypeScript, Vite, MUI, Recharts, TanStack Query, React Router, axios.
- **server/**: Node, Express 5, TypeScript, Mongoose, zod, jsonwebtoken, bcryptjs, express-rate-limit, csv-stringify, helmet, cors.
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

| Command                   | What it does                                                                                                                                              |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`             | API with auto-restart (tsx watch) and the Vite client, side by side                                                                                       |
| `npm run seed`            | Loads `server/data/transactions.json` and the demo user. Safe to repeat; see [Seeding](#seeding)                                                          |
| `npm run seed -- --reset` | Deletes all transactions first, then seeds. Users are kept                                                                                                |
| `npm run build`           | Compiles the server to `server/dist` and bundles the client                                                                                               |
| `npm run lint`            | ESLint (type-aware rules) in both workspaces                                                                                                              |
| `npm run typecheck`       | `tsc` in both workspaces                                                                                                                                  |
| `npm test`                | Server tests (unit and integration), then client tests. **The first run downloads MongoDB for the server tests (about 780 MB, one time, a few minutes).** |
| `npm run format`          | Formats the repo with Prettier                                                                                                                            |
| `npm run format:check`    | Fails if any file isn't formatted                                                                                                                         |

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

- **One query builder.** `buildTransactionQuery()` in [server/src/queries/](server/src/queries/buildTransactionQuery.ts) is a pure function from validated filters to a Mongo query. The list, analytics and export endpoints all use it, so a filter can't mean one thing in the table and another in a chart or a CSV. It has full unit-test coverage.
- **One filter schema** validates both query strings (`statuses=Paid,Pending`) and JSON bodies (`["Paid", "Pending"]`). It rejects unknown parameters, so a typo like `statuss=Paid` is a 400, not silently unfiltered data. It also rejects backwards ranges (`dateFrom` after `dateTo`).
- **Dates are UTC days, inclusive.** `dateTo=2024-03-31` includes the whole of 31 March, because the bound is "before 1 April 00:00 UTC".
- **Search** is a case-insensitive "contains" match on user, category and status. A number also matches an exact id or amount (`1,500.50` works). Input is regex-escaped, so `.*` matches the literal text rather than every row, and a pattern can't be crafted to run slowly.
- **Sorting** is limited to a whitelist of fields. Ties are broken by `id`, so paging through a sort with many equal values never repeats or skips a row.

## Analytics

`GET /api/analytics/summary` and `GET /api/analytics/trend` take the same filters as the table. Everything on the dashboard therefore describes the same set of transactions.

- **Summary** is a single `$group` by category and status, which yields at most four buckets. The totals, the category split and the status split are all derived from those buckets in [analytics.transform.ts](server/src/services/analytics.transform.ts), a pure function. Amounts are rounded to cents once, after summing, so floating-point noise never reaches the client.
- **Trend** groups by UTC calendar month (`$dateTrunc`, which needs MongoDB 5.0 or later). Months with no transactions are filled with zeros, so the chart's x-axis has no gaps. The range follows `dateFrom` and `dateTo` when they're set.
- Both always return every category and status, with zeros when nothing matches. The client never has to handle a missing key.

## CSV export

`POST /api/transactions/export` with `{ columns, filters, sort }` streams a CSV of every matching row, not just the current page. It is a POST because the column list and filters are JSON, and because the client downloads the result as a blob: a plain link couldn't carry the `Authorization` header.

- **Streaming:** rows flow from a MongoDB cursor through csv-stringify into the response. Memory stays flat however many rows match. If the download is cancelled, `pipeline()` tears everything down, including the database cursor.
- **Whitelisted columns:** only the seven transaction fields can be exported, in the order the client chooses. Anything else (`_id`, `passwordHash`) is a 400.
- **Spreadsheet-safe:**
  - The header row uses readable labels.
  - Dates are ISO 8601 in UTC.
  - Amounts have 2 decimals and no currency symbol, so they stay numeric.
  - Text starting with `=`, `+`, `-` or `@` is prefixed with an apostrophe, so a spreadsheet can't run it as a formula.
- **Validation happens before streaming starts,** so a bad request gets a normal JSON error, never half a file.
- **The filename** names the date range it covers, for example `transactions_2024-01-01_to_2024-03-31.csv`, and is sent in `Content-Disposition`.

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
                     (services/*.transform.ts and csvFormat.ts are the pure, unit-tested parts)
    schemas/         zod request schemas (login, transaction filters and paging)
    queries/         buildTransactionQuery(), buildTransactionSort(), analytics pipelines: pure, shared by every data endpoint
    middleware/      requireAuth, login rate limit, central error handler, 404 handler
    types/           Express Request augmentation (req.user)
    errors/          AppError: the one error type that reaches clients
    utils/           logger, password hashing, durations, UTC days and months, regex escaping, money rounding, zod issue formatting
  tests/
    setup/           in-memory MongoDB, "_test" database guard
    unit/  integration/
client/
  src/
    api/             axios instance (token + 401 interceptors), error normalising, React Query client
    auth/            session storage
    providers/       Alert, Query and Auth providers (+ their contexts)
    hooks/           URL state (useTransactionFilters, useTableParams), data hooks (useSummary, useMonthlyTrend, useTransactions, useFilterOptions), inputs (useDebouncedInput, useSlashToFocus), useAuth, useAlerts
    layout/          AppLayout, Sidebar, TopBar, UserMenu, ProtectedRoute
    pages/           Login, Dashboard, Transactions, NotFound
    config/          locale and currency (the one place they are set)
    components/      common/ (states, pills, chips, cards), charts/, dashboard/, transactions/, auth/
    theme/           design tokens and the MUI theme
    test/            test setup and the client tests
  vite.config.ts     proxies /api to the server in development
docs/                plan, API reference, brief
```

## Frontend

Signing in takes you to the dashboard. Every other page requires a session; without one, you're sent to the login page and brought back to where you were headed afterwards.

- **Theme:** the colours are sampled from the design's colour styles (the screenshots carry no hex values). They live in [client/src/theme/tokens.ts](client/src/theme/tokens.ts), and components read them only through the MUI theme.
  - Dark surfaces.
  - Green primary.
  - Yellow for expenses and pending.
  - Orange for errors.
  - Poppins as the typeface.
- **Error chips:** every API error appears as an alert chip in the top-right corner, from one place. TanStack Query's global `onError` hands each failed request (after retries) to the `AlertProvider`. Components never display API errors themselves. When several requests fail for the same reason (the API is down, the session has expired), you see one chip, not five.
- **Sessions:** the token is kept in `localStorage`, so it survives a reload. The trade-off is that any script running on the page could read it; the server's CSP and the 8-hour expiry limit that.
  - Expired tokens are dropped before they're ever sent.
  - Any 401 from the API clears the session, and the route guard redirects to the login page. A wrong password on the login form is the one 401 that doesn't do this.
  - If the API can't be reached while checking a saved session, you get a "Try again" screen instead of being logged out.
- **Avatars** are initials on a tinted square, with the colour derived from the name. The data's `user_profile` URL is never loaded: that site returns a different random face on every request.
- **Sidebar:** Dashboard and Transactions are live. The design's other items (Wallet, Analytics, Personal, Message, Setting) are shown disabled with a "Coming soon" tooltip rather than as empty pages. Below the `md` breakpoint the sidebar shrinks to icons only.
- **Filters live in the URL.** `useTransactionFilters()` reads and writes them in the query string, using the same parameter names as the API. The address bar and the API request are therefore always the same filter.
  - The cards, the overview chart, the breakdowns and the table all read from this one hook, so they always describe the same transactions.
  - A filtered view can be bookmarked or shared, and Back undoes a filter change.
  - Try `/?statuses=Pending` or `/?categories=Expense&dateFrom=2024-07-01`.
- **Dashboard:**
  - **Cards:** Balance (revenue minus expenses), Revenue, Expenses and Pending. The design's fourth card is "Savings", but there is no savings data, so it shows the pending total instead.
  - **Overview:** a monthly revenue (green) vs expenses (yellow) chart.
  - **Breakdowns:** by category (a donut with each side's share) and by status (paid and pending, each split into revenue and expenses).
  - **Latest transactions:** the 5 most recent overall. It is labelled as unaffected by filters, because it's a feed.
  - **Filtered notice:** when a filter is active, a notice above the cards says so, with how many transactions match and a Clear button.
- **Transactions table** (on the dashboard, and full-page at `/transactions`):
  - **Server-side:** paging (10, 25 or 50 rows), sorting on every column (the active column shows its direction) and filtering.
  - **Columns:** ID, User (initials avatar), Date (hover for the exact UTC time), Category, a signed Amount (green in, yellow out) and a Status pill.
  - **Search** waits 300 ms after the last keystroke. `/` focuses it, Escape clears it, and text you're still typing is never overwritten by the round trip.
  - **Date range** is a popover with native date inputs and presets built from the years in the data (a year and its quarters). There is no date library.
  - **The Filters popover** has amount min/max (checked before sending, so min > max never reaches the API) and multi-selects for category, status and user, fed by `/api/transactions/filter-options`.
  - **Chips:** every applied filter shows as a removable chip, one per value, with Clear all.
  - **Paging:** changing any filter, the sort or the page size goes back to page 1. Page, size and sort also live in the URL, so a shared link opens on the same page.
  - **States:** while the next page loads, the current one stays visible, dimmed. The first load shows skeleton rows. There are empty states for "nothing matches" (with Clear filters) and for a page past the end.
- **Money and dates** are formatted with `Intl`, from one config file ([client/src/config/locale.ts](client/src/config/locale.ts): `en-US`, `USD`). Dates are shown in UTC, matching how the server filters and groups them.
- **Loading, empty and error states:** every block has all three.
  - First load: skeletons shaped like the content.
  - Changing filters: the previous numbers stay visible, dimmed, instead of flashing back to skeletons.
  - No match: an empty state with a Clear filters button.
  - Failure: an error block with Try again, alongside the global error chip.
- **Bundle size:** the production client is currently one 1.06 MB JavaScript file (323 KB gzipped). Splitting it per route, so the charts load only with the dashboard, is the next step.
- **API location:** the client calls `/api`, which Vite proxies to port 4000 in development. For a deployed build, set `VITE_API_BASE_URL` at build time.

## Error format

Every error response has the same shape, produced by one central handler:

```json
{ "error": { "code": "NOT_FOUND", "message": "Route GET /api/nope does not exist" } }
```

Validation errors add a `details` array of `{ path, message }`. Unexpected errors return a generic 500 message. The real error is logged on the server and never sent to the client. The full list of codes is in [docs/API.md](docs/API.md).

## Testing

`npm test` starts a throwaway in-memory MongoDB, so tests never touch Atlas or your local data. As a second safeguard, the test helper refuses to connect to any database whose name doesn't end in `_test`.

**The first `npm test` downloads a MongoDB binary** (about 780 MB on Windows, a few minutes). It is cached in `node_modules/.cache/mongodb-memory-server`, so later runs start in about a second. `npm install` never downloads it: only people who run the tests pay that cost.

The client has two deliberately focused tests, run with Vitest, jsdom and React Testing Library. The first checks that an API error, from the network layer through React Query, reaches the user as an alert chip with the server's message. The second (Phase 10) checks that Export is disabled when no columns are selected.

## Technical decisions

- **Express 5.** Errors thrown in route handlers, including async ones, reach the error handler without wrapper functions.
- **TypeScript 6.0, not 7.** typescript-eslint, which provides the type-aware lint rules, supports TypeScript only up to 6.0.
- **Older majors for Node 20 support:** Vitest 4, concurrently 9, React Router 7, jsdom 27 and jest-dom 6.9. Their newer majors all require Node 22.
- **`mongodb-memory-server-core`, not `mongodb-memory-server`.** It's the same library without the install hook. That keeps `npm install` fast and moves the MongoDB download to the first test run.
- **No dotenv.** Node's built-in `--env-file` flag loads `server/.env`, and `tsx watch` passes it through.
- **ESM throughout.** The server uses `"type": "module"` with `NodeNext` resolution, so relative imports end in `.js`.
