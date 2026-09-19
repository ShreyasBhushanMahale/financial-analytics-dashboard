# Financial Analytics Dashboard — Project Context

## What this is

A full-stack hiring assignment.
Graded on **code quality**, **problem-solving approach**, and **creativity**.
Partial submissions are accepted, so core features must be finished and solid before any extras.

- Brief: `docs/assignment.pdf`
- Build plan: `docs/PLAN.md` (created in Phase 0)
- Design references: `design/*.png` (screenshots of the Figma file)
- Seed data: `server/data/transactions.json`

## Stack (fixed)

- **client/**: React + TypeScript (Vite), MUI, Recharts, TanStack Query, React Router, axios
- **server/**: Node 20.19+ with tsx (runs the TypeScript in dev and the seed script), Express + TypeScript, Mongoose, zod, jsonwebtoken, bcryptjs, csv-stringify, helmet, cors, express-rate-limit
- **Root**: npm workspaces; `concurrently` runs client and server together
- **Database**: MongoDB Atlas (free tier), connected through `MONGODB_URI` in `server/.env`. No Docker. The app must work with any MongoDB URI, local or Atlas.
- **Dev machine**: Windows + PowerShell. npm scripts must work on Windows (no bash-only commands like `rm -rf`).
- **Tests**: Vitest + Supertest on the server, with integration tests on `mongodb-memory-server-core` (no install hook: the MongoDB binary downloads on the first test run, never during `npm install`); Vitest + React Testing Library for two client tests only

Don't add dependencies outside this list without asking me first.

## Data facts (checked against the JSON)

- 300 records with fields: `id` (int, unique), `date` (ISO string), `amount` (150–5000), `category`, `status`, `user_id`, `user_profile`.
- `category` has only two values: `Revenue`, `Expense`. `status` has only `Paid`, `Pending`.
- `user_id` is one of `user_001` to `user_004`.
- Every date is in 2024 (Jan 2 to Dec 23).
- `user_profile` is the same URL on every row, and that site returns a different random face on each load.
- There are no login users in the data.
- Expected totals after seeding: 300 rows, Revenue 339,803.25, Expense 206,605.00, Pending 205,303.00 (114 rows).

What follows from this:

- Store `date` as a real `Date`. Keep the numeric `id` as its own unique field, separate from Mongo `_id`.
- The default date filter is "no restriction". A "last 30 days" default would show an empty dashboard.
- Because there are only two categories, the breakdown section also shows totals by status and by user.
- The UI shows generated initials avatars instead of hotlinking `user_profile`. The field is still stored and exportable.
- Seed a demo login user from `.env` values, with the password hashed.

## Design notes (design/ has only the dashboard screen)

- Dark theme, green primary accent, yellow for expenses/pending. Take exact colours from design/colors.md if present, otherwise design/05*-colors-*.png.
- Use our own app name instead of "Penta".
- Cards: Balance = net (revenue − expenses), Revenue, Expenses. The design's 4th card is "Savings", but we have no savings data, so use "Pending" (total pending amount).
- Overview chart = monthly revenue vs expenses trend. The design uses green for income and yellow for expenses; keep that.
- "Recent Transaction" panel = latest 5 transactions.
- Transactions table: design shows Name, Date, Amount, Status. We show user_id with an initials avatar in place of Name, and add ID and Category columns. Status pills: Paid = green, Pending = yellow.
- Sidebar: only Dashboard and Transactions are real pages. Show the other items as disabled with a "Coming soon" tooltip. Don't build placeholder pages.
- Login page isn't in the design. Build it in the same visual style: dark background, centred card, green primary button.
- The date range picker and search sit in the table header, as in the design.

## Architecture rules

- Filtering, search, sort and pagination happen on the server. Never fetch all rows to filter in the browser.
- One pure function, `buildTransactionQuery()`, turns filters into a Mongo query. The list, analytics and export endpoints all use it, so they always agree.
- Sortable fields and exportable columns are whitelisted on the server. Every request is validated with zod.
- User search input is escaped before it goes into a regex.
- All errors use one shape: `{ error: { code, message, details? } }`, produced by a central error handler.
- Client: every API error shows up as an alert chip through one global alert provider. A 401 clears the session and redirects to login.
- CSV export is a POST with `{ columns, filters, sort }`. The server streams the CSV with a header row and a `Content-Disposition` filename. The client downloads it as a blob, because the JWT is sent in the Authorization header and a plain link can't carry it.
- Secrets live only in `.env`. Commit `.env.example`, never `.env`.

## Code style

- Small, focused files. Server layers: routes → controllers → services. No business logic in route files.
- Strict TypeScript. No `any`.
- Charts and table components are presentational. Data fetching lives in hooks.
- Colors and spacing come from the MUI theme file, not hardcoded in components.
- Every data view has loading, empty and error states.
- Comments explain _why_, not _what_. No leftover `console.log`.

## How we work

- One phase at a time, following `docs/PLAN.md`.
- For each phase: propose a plan, wait for my approval, then implement.
- After implementing: run lint, typecheck and tests. Then tell me what changed, how to check it manually, and stop.
- Don't start the next phase on your own.
- Don't commit. I review the diff and commit myself.

## Commands

All commands run from the repo root.

- Install: `npm install` (both workspaces; the first run also downloads a MongoDB binary for tests)
- Start MongoDB: nothing to start. Set `MONGODB_URI` in `server/.env` (Atlas or local). Tests use an in-memory MongoDB.
- Seed: `npm run seed` (idempotent; `npm run seed -- --reset` deletes transactions first, keeps users)
- Dev (client + server): `npm run dev` (client on :5173, API on :4000, `/api` proxied)
- Lint / typecheck / test: `npm run lint` · `npm run typecheck` · `npm test`
- Format: `npm run format` (check only: `npm run format:check`)
