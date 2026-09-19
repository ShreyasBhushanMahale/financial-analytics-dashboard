# Build Plan: Financial Analytics Dashboard

Approved 2026-09-18. Project rules live in `CLAUDE.md`. This file covers what we build and in what order.

## Timeline and working rules

- **Deadline: 2026-09-19, 11:59 PM.** Phases 1–2 were done on 2026-09-18; phases 3–11 are done on 2026-09-19.
- If a nice-to-have competes with finishing a phase, finish the phase.
- **From Phase 4 on (decided 2026-09-19), phases are built directly from this plan, without a separate plan-and-approve step.** Work stops mid-phase only for a decision that changes the design. After each phase: lint, typecheck and tests pass, `README.md` and `docs/API.md` are updated, a short summary is given, and work stops so the phase can be committed.
- **Scope cuts (2026-09-19)**, already applied to the sections below:
  - Trend chart is monthly only (no weekly interval).
  - Analytics breakdown covers category and status only (no per-user bars).
  - Export modal: checkbox column list, select all/none, scope toggle with row counts, 3-row preview and the download. No reordering, no presets.
  - No mobile drawer and no sticky first column: the table scrolls horizontally.
  - Phases 5 and 6 get unit tests only. `buildTransactionQuery()` keeps full unit coverage.
  - All stretch items are dropped.
- Fallbacks are decided in advance, so no time goes into debugging tooling:
  - **mongodb-memory-server**: if it isn't working within about 10 minutes (binary download, Windows issues), drop it. Integration tests then run against a `finance_dashboard_test` database on Atlas through `MONGODB_TEST_URI`.
  - **Express 5**: if it causes any middleware trouble, switch to Express 4 immediately and add an async error wrapper.

## 1. Folder structure

```
Loopr/
├─ package.json              # npm workspaces [client, server]; root scripts: dev, seed, lint, typecheck, test
├─ README.md
├─ docs/  PLAN.md  API.md  assignment.pdf
├─ server/
│  ├─ .env.example
│  ├─ data/transactions.json
│  ├─ scripts/seed.ts
│  ├─ src/
│  │  ├─ app.ts                  # builds the Express app without listen(), so Supertest can import it
│  │  ├─ server.ts               # connect DB → listen → graceful shutdown
│  │  ├─ config/env.ts           # zod-parsed env; fails fast on boot
│  │  ├─ db/connect.ts
│  │  ├─ models/                 # transaction.model.ts, user.model.ts
│  │  ├─ schemas/                # zod: login, filters, listQuery, analyticsQuery, exportBody
│  │  ├─ routes/                 # health, auth, transactions, analytics, index (mounts /api)
│  │  ├─ controllers/
│  │  ├─ services/               # auth, transaction, analytics, export
│  │  ├─ queries/buildTransactionQuery.ts
│  │  ├─ middleware/             # requireAuth, validate, errorHandler, notFound, rateLimit
│  │  ├─ errors/AppError.ts
│  │  ├─ constants/fields.ts     # SORTABLE_FIELDS, EXPORT_COLUMNS (+ CSV header labels)
│  │  └─ utils/                  # escapeRegex, round2, utcDayBounds, logger
│  └─ tests/  setup/  unit/  integration/
└─ client/
   ├─ vite.config.ts             # dev proxy /api → :4000
   └─ src/
      ├─ main.tsx  App.tsx       # providers + routes
      ├─ theme/                  # tokens.ts (design colours), theme.ts
      ├─ api/                    # http.ts (axios + interceptors), auth, transactions, analytics, export
      ├─ types/                  # API types mirroring server responses
      ├─ providers/              # AuthProvider, AlertProvider, QueryProvider
      ├─ hooks/                  # useTransactions, useSummary, useTrend, useFilterOptions,
      │                          # useTransactionFilters (URL state), useExportCsv, useDebouncedValue
      ├─ layout/                 # AppLayout, Sidebar, TopBar, ProtectedRoute
      ├─ pages/                  # Login, Dashboard, Transactions, NotFound
      ├─ components/
      │  ├─ common/              # StatusPill, UserAvatar, Amount, SectionCard, EmptyState, ErrorState
      │  ├─ dashboard/           # KpiCard, KpiRow, OverviewChart, RecentTransactions, BreakdownSection
      │  ├─ transactions/        # TransactionsPanel, Toolbar, DateRangeButton, FilterPopover,
      │  │                       # ActiveFilterChips, TransactionsTable
      │  └─ export/              # ExportDialog, ColumnPicker, ExportPreview
      ├─ utils/                  # format (Intl, UTC), initials, downloadBlob, filterParams
      └─ test/
```

## 2. Mongoose schemas and indexes

**Transaction:** `id: Number` (required, unique), `date: Date`, `amount: Number` (min 0), `category: enum[Revenue, Expense]`, `status: enum[Paid, Pending]`, `user_id: String`, `user_profile: String`. `versionKey: false`. Responses use `.lean()` with `_id` projected out.

**User:** `email` (unique, lowercase, trimmed), `name`, `passwordHash` (`select: false`, bcrypt cost 12).

| Index                                    | Query it serves                                                                                                 |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `transactions { id: 1 }` unique          | Seed upsert by `id`; numeric search `id = n`                                                                    |
| `transactions { date: -1, id: -1 }`      | Default list sort (newest first, stable tiebreak); Latest 5; date-range `$match` for list, analytics and export |
| `transactions { user_id: 1, date: -1 }`  | User filter plus default sort (equality before sort)                                                            |
| `transactions { status: 1, date: -1 }`   | Status filter plus sort; Pending card                                                                           |
| `transactions { category: 1, date: -1 }` | Category filter plus sort; revenue/expense totals and trend                                                     |
| `transactions { amount: 1, id: 1 }`      | Amount range filter; amount sort                                                                                |
| `users { email: 1 }` unique              | Login lookup                                                                                                    |

The reasoning behind these indexes goes in the README (Phase 2):

- At 300 rows a collection scan is already fast; the indexes are there for when the data grows.
- `category` and `status` have only two values each, so they only appear paired with `date`, where they remove the in-memory sort.
- Search uses an unanchored case-insensitive regex, which can't use an index. We accept that.

## 3. API endpoints

All routes are under `/api`. Every error returns `{ error: { code, message, details? } }`. The codes are `VALIDATION_ERROR` 400, `UNAUTHORIZED`/`TOKEN_EXPIRED`/`INVALID_CREDENTIALS` 401, `NOT_FOUND` 404, `PAYLOAD_TOO_LARGE` 413, `RATE_LIMITED` 429, `INTERNAL_ERROR` 500 and `SERVICE_UNAVAILABLE` 503.

**Filters** are shared by the list, analytics and export endpoints. One zod schema validates them and `buildTransactionQuery()` turns them into a Mongo query:

- `search`: max 100 characters, trimmed.
- `dateFrom`, `dateTo`: `YYYY-MM-DD`, inclusive, UTC.
- `amountMin`, `amountMax`: 0 or more.
- `categories[]`, `statuses[]`, `userIds[]`.
- zod refinements enforce `dateFrom ≤ dateTo` and `amountMin ≤ amountMax`.
- In query strings, arrays are comma-separated (`statuses=Paid,Pending`). In the export body they are JSON arrays.

| Method & path                      | Auth             | Params                                                                                                                                            | Response                                                                                                                                                 |
| ---------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /health`                      | –                | –                                                                                                                                                 | `{ status: "ok", db: "connected" }`; 503 `SERVICE_UNAVAILABLE` (error shape) when the database isn't connected                                           |
| `POST /auth/login`                 | – (rate-limited) | body `{ email, password }`                                                                                                                        | `{ token, expiresAt, user: { id, email, name } }`                                                                                                        |
| `GET /auth/me`                     | JWT              | –                                                                                                                                                 | `{ user }`                                                                                                                                               |
| `GET /transactions`                | JWT              | Filters + `page` (≥1), `pageSize` (1–100; UI offers 10/25/50/100), `sortBy` (id, date, amount, category, status, user_id), `sortOrder` (asc/desc) | `{ data: Transaction[], meta: { page, pageSize, total, totalPages } }`                                                                                   |
| `GET /transactions/filter-options` | JWT              | –                                                                                                                                                 | `{ categories, statuses, userIds, dateRange: {min,max}, amountRange: {min,max} }`                                                                        |
| `POST /transactions/export`        | JWT              | body `{ columns: ExportColumn[] (≥1, unique, whitelisted), filters, sort: { by, order } }`                                                        | Streamed `text/csv`, see below                                                                                                                           |
| `GET /analytics/summary`           | JWT              | Filters                                                                                                                                           | `{ totals: { revenue, expense, net, pending, pendingCount, count }, byCategory: [{ key, total, count }], byStatus: [{ key, revenue, expense, count }] }` |
| `GET /analytics/trend`             | JWT              | Filters                                                                                                                                           | `{ points: [{ period: ISODate, revenue, expense }] }`, one point per month. Empty months are filled with 0                                               |

How the endpoints work:

- **List:** the page query and `countDocuments` run in parallel. Sorting always adds `id` as a tiebreaker so pagination is stable.
- **Summary:** one `$facet` aggregation, so it's a single round trip.
- **Trend:** `$dateTrunc` in UTC. This needs MongoDB 5.0 or later, which the README states.
- **Money:** all totals are rounded to 2 decimal places.

**Export:**

- A Mongo cursor feeds `csv-stringify` through `pipeline()`, so an aborted download cleans up.
- The CSV has a header row with readable labels. Dates are ISO 8601. Amounts have 2 decimals and no currency symbol, so spreadsheets read them as numbers.
- Response headers: `Content-Disposition: attachment; filename="transactions_<range-or-timestamp>.csv"` and `Cache-Control: no-store`. CORS exposes `Content-Disposition` to the client.
- Text cells that start with `= + - @` are escaped, so a spreadsheet won't run them as formulas.
- Validation happens before streaming starts, so errors still come back as JSON.

**Security:**

- `helmet`.
- CORS limited to `CLIENT_ORIGIN`.
- JSON body limit.
- Login rate limit (10 attempts per 15 minutes).
- JWT signed with HS256, 8h expiry.
- Login runs a bcrypt compare even for unknown emails, so response timing doesn't reveal which accounts exist.

## 4. Frontend pages, components and endpoints

Filters, sort and page live in the URL (`useTransactionFilters`). That means filtered views can be shared, the back button works, and state survives a refresh.

**Filters drive the whole dashboard:** KPI cards, overview chart, breakdown and table. When any filter is active, the cards show a "Filtered" badge. Recent Transactions ignores filters and is labelled **"Latest 5 overall"**.

| Page / component                                                                                                                                                                                                 | Calls                                                                        |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **LoginPage**: centred card, green button (not in the design; built in the same style)                                                                                                                           | `POST /auth/login`                                                           |
| **AuthProvider**: checks the stored token on boot                                                                                                                                                                | `GET /auth/me`                                                               |
| **AppLayout**: Sidebar (Dashboard and Transactions active, others disabled with "Coming soon"); TopBar (title, search, disabled bell, avatar menu with logout)                                                   | –                                                                            |
| **DashboardPage**                                                                                                                                                                                                |                                                                              |
| · KpiRow: Balance (net), Revenue, Expenses, Pending, with the "Filtered" badge                                                                                                                                   | `GET /analytics/summary`                                                     |
| · OverviewChart: smooth green/yellow lines, monthly                                                                                                                                                              | `GET /analytics/trend`                                                       |
| · RecentTransactions "Latest 5 overall": ignores filters; "See all" goes to /transactions                                                                                                                        | `GET /transactions?pageSize=5&sortBy=date&sortOrder=desc`                    |
| · BreakdownSection: category donut and status split                                                                                                                                                              | `GET /analytics/summary` (same cached query)                                 |
| · TransactionsPanel (below)                                                                                                                                                                                      |                                                                              |
| **TransactionsPage**: TransactionsPanel full-page                                                                                                                                                                |                                                                              |
| **TransactionsPanel**: Toolbar (debounced search, DateRangeButton, Filters, Export), ActiveFilterChips, TransactionsTable (ID, User with avatar, Date, Category, Amount ±, Status pill; sort labels; pagination) | `GET /transactions`, `GET /transactions/filter-options`                      |
| **DateRangeButton**: popover with two native `<input type="date">` fields and presets (All time, quarters from the data's date range, custom). No paid MUI components, no date library                           | –                                                                            |
| **ExportDialog**: checkbox column list with select all/none, scope toggle (Current filters / All transactions) with row counts, 3-row preview, download                                                          | `GET /transactions?pageSize=3` (preview), `POST /transactions/export` (blob) |

**Export preview follows the scope toggle.** The preview is the first 3 rows of what will actually be exported. It is fetched with the scope's filters (or none, for "All transactions") and the current sort. The row count comes from the same response. It never reuses rows from the current table page.

**Avatars** are generated from initials: `user_id` in the table, the user's name in the top bar. The `user_profile` URL is never loaded. It is still stored and exportable.

**Error handling:**

- One QueryCache/MutationCache `onError` sends every error to the AlertProvider, which shows chips and drops duplicates.
- A 401 clears the session and redirects to `/login?from=…`. `/auth/login` is excluded so a wrong password doesn't redirect back to the login page.
- For export errors, the error body arrives as a Blob, so it is parsed back into JSON before it is shown.

Every data view has skeleton, empty ("No matches · Clear filters") and error-with-retry states.

On narrow screens the table scrolls horizontally. There is no mobile drawer and no sticky column.

**Theme tokens (sampled from the design):**

| Token                             | Value                |
| --------------------------------- | -------------------- |
| Page background (Bg sec2)         | `#282C35`            |
| Panels, sidebar, top bar (Bg sec) | `#1A1C22`            |
| Deepest background (Bg main)      | `#111317`            |
| Primary, Revenue, Paid            | `#1FCB4F`            |
| Warning, Expense, Pending         | `#FFC01E`            |
| Error                             | `#F46D22`            |
| Secondary text                    | `#9A9A9A`            |
| Extra chart series                | `#6D61FF`, `#64CFF9` |

Status pills use the accent colour at about 30% opacity, which matches the sampled `#1B5932` and `#5E4E21`. The font is Poppins, loaded from Google Fonts.

## 5. Testing

- **Server:**
  - Unit tests cover the pure functions: `buildTransactionQuery` (full coverage), `escapeRegex`, the error handler and CSV row mapping.
  - Phases 5 (analytics) and 6 (export) have unit tests only.
  - Integration tests use Supertest on `mongodb-memory-server-core`, which downloads MongoDB on the first test run instead of during `npm install`.
  - The test setup refuses to run unless the database name ends in `_test`, so the real data can't be wiped.
- **Client (two tests only):**
  - An API error shows an alert chip.
  - Export is disabled when 0 columns are selected.

## 6. Build order

Each phase ends with lint, typecheck and tests passing and README.md and docs/API.md updated. Then work stops for review.

| #   | Phase               | Delivers                                                                                                                                                                                                                           | Done when                                                                                                                                    |
| --- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Scaffold            | Workspaces, strict TS, ESLint/Prettier, Express 5 app/server split, env schema, AppError, error handler and notFound, `/health`, integration test harness, `.env.example`, README and API.md skeletons, fill in CLAUDE.md Commands | `npm run lint/typecheck/test` pass at root; `/api/health` returns `{ status: "ok", db: "connected" }` through the Vite proxy; client renders |
| 2   | Seed                | Models and indexes; `seed.ts` validates each row with zod, upserts by `id`, runs `syncIndexes`, upserts the demo user; `--reset` (transactions only); index reasoning in README                                                    | Seed prints 300 / 339,803.25 / 206,605.00 / 205,303.00 (114) and exits non-zero on a mismatch; running it again changes nothing              |
| 3   | Auth                | Login, `/me`, `requireAuth`, rate limit                                                                                                                                                                                            | Tests cover valid, wrong-password, malformed, missing-token and expired-token cases                                                          |
| 4   | Transactions API    | Filters schema, `buildTransactionQuery` + `escapeRegex`, list, filter-options                                                                                                                                                      | Unit tests cover every filter and search input `.*` matching literally; integration tests cover sort whitelist and pagination meta           |
| 5   | Analytics API       | Summary (`$facet`), trend (gap-filled)                                                                                                                                                                                             | Unit tests: pipeline built from filters, totals rounded, empty months filled with 0                                                          |
| 6   | Export API          | Column whitelist, streaming, headers                                                                                                                                                                                               | Unit tests: column whitelist, header order and labels, row formatting, filename, formula escaping                                            |
| 7   | Frontend foundation | Client test harness, theme, axios with interceptors, Query/Alert/Auth providers, router + ProtectedRoute, AppLayout, LoginPage                                                                                                     | Client test: an API error shows a chip                                                                                                       |
| 8   | Dashboard           | Hooks, KPI row with "Filtered" badge, overview chart, "Latest 5 overall", breakdown                                                                                                                                                | All states render; numbers match the API                                                                                                     |
| 9   | Table and filters   | URL filter state, panel, table, search, date range popover, filter popover, chips, Transactions page                                                                                                                               | Manual check: every filter, sort and page change hits the API and updates the whole dashboard                                                |
| 10  | Export modal        | ExportDialog: checkbox columns, select all/none, scope toggle with row counts, 3-row preview, blob download, Blob error parsing                                                                                                    | Client test: Export is disabled with 0 columns; manual check that the file downloads with the right filename                                 |
| 11  | Final pass          | README screenshots, fresh-clone run-through, responsive and accessibility check                                                                                                                                                    | Fresh clone → install → seed → dev works by following the README                                                                             |

## 7. Assumptions

1. **Design is one screen, but we have two pages.** The Dashboard follows the design, including the transactions panel. The Transactions page reuses the same panel full-page, with no charts.
2. **Timezone:** UTC everywhere for filter day bounds, monthly grouping and displayed dates, so a transaction never appears on a different day than the filter says.
3. **Amount sign:** every stored amount is positive. The category decides the sign and colour (+green Revenue, −yellow Expense). Sort and amount filters use the stored positive value.
4. **Search:** a case-insensitive escaped regex on `user_id`, `category` and `status`. If the term is a number, it also matches `id` or `amount` exactly. "Real-time" means as-you-type with a 300ms debounce, and stale requests are cancelled.
5. **Logout** drops the token on the client. A stateless JWT can't be revoked without a denylist, which is out of scope; the README documents this.
6. **Token storage** is localStorage. It's simple and survives a refresh, but carries some XSS exposure; helmet's CSP and the 8h expiry reduce that. There is no refresh token.
7. **Design labels:** "Completed" becomes **Paid**. Currency is **USD**. "Tranfers from/to" in Recent Transactions becomes a category label + `user_id`.
8. **"Auto-download when ready":** the export is a synchronous stream and the browser download starts when it finishes. A job queue with polling isn't justified for this data size.
9. **Export scope:** every row matching the filters (not just the current page), in the current sort order, or all transactions when the toggle says so.
10. **Registration:** none. The only user is the seeded demo user.
11. **Colour swatches:** the purple and cyan "Main" swatches don't appear on the dashboard, so they are used only for extra chart series. The "Text 100" swatch (`#1A1B2F`) is a light-theme text colour, so on dark backgrounds text is white and `#9A9A9A`.
