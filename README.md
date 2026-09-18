# Ledgerline

A financial analytics dashboard for tracking company transactions. It has JWT login, a filterable, sortable and searchable transaction table, revenue and expense charts, and a configurable CSV export.

This is a hiring assignment. The brief is in `docs/assignment.pdf`, the build plan in [docs/PLAN.md](docs/PLAN.md), and the endpoint reference in [docs/API.md](docs/API.md).

## Status

| Phase                                                                  | State   |
| ---------------------------------------------------------------------- | ------- |
| 1. Scaffold: workspaces, tooling, Express app, health check, tests     | Done    |
| 2. Seed the database                                                   | Pending |
| 3. Auth (JWT)                                                          | Pending |
| 4. Transactions API (filter, search, sort, paginate)                   | Pending |
| 5. Analytics API                                                       | Pending |
| 6. CSV export API                                                      | Pending |
| 7–10. Frontend: foundation, dashboard, table and filters, export modal | Pending |
| 11. Final pass                                                         | Pending |

## Tech stack

- **client/**: React 19, TypeScript, Vite. MUI, Recharts, TanStack Query, React Router and axios arrive in Phase 7.
- **server/**: Node, Express 5, TypeScript, Mongoose, zod, helmet, cors.
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

# 2. Create the server's environment file, then set MONGODB_URI in it
cp server/.env.example server/.env        # PowerShell: Copy-Item server/.env.example server/.env

# 3. Start the API (port 4000) and the client (port 5173) together
npm run dev
```

Open http://localhost:5173. To check that the API can reach the database, open http://localhost:5173/api/health. It should return `{"status":"ok","db":"connected"}`.

Notes:

- **First install takes a few minutes.** The test suite runs against a real `mongod`, so `npm install` downloads MongoDB once. The archive is about 780 MB, and about 75 MB is kept in `node_modules/.cache`.
- **Atlas:** add your IP address under _Network Access_, or the server exits after 10 seconds with a `MongooseServerSelectionError`.

## Scripts

Run these from the repo root.

| Command                | What it does                                                        |
| ---------------------- | ------------------------------------------------------------------- |
| `npm run dev`          | API with auto-restart (tsx watch) and the Vite client, side by side |
| `npm run build`        | Compiles the server to `server/dist` and bundles the client         |
| `npm run lint`         | ESLint (type-aware rules) in both workspaces                        |
| `npm run typecheck`    | `tsc` in both workspaces                                            |
| `npm test`             | Server test suite (unit and integration)                            |
| `npm run format`       | Formats the repo with Prettier                                      |
| `npm run format:check` | Fails if any file isn't formatted                                   |

## Environment variables (`server/.env`)

| Variable        | Required | Default                 | Purpose                                                           |
| --------------- | -------- | ----------------------- | ----------------------------------------------------------------- |
| `MONGODB_URI`   | Yes      | –                       | `mongodb://` or `mongodb+srv://` URI; its path names the database |
| `PORT`          | No       | `4000`                  | API port (the Vite proxy expects 4000)                            |
| `CLIENT_ORIGIN` | No       | `http://localhost:5173` | The only origin CORS allows                                       |
| `NODE_ENV`      | No       | `development`           | `development`, `test` or `production`                             |

`.env.example` also lists the JWT and demo-user variables used from Phase 2 onwards. The server validates its environment on startup and lists every missing or invalid variable before exiting.

## Project structure

```
package.json         npm workspaces + root scripts
server/
  src/
    app.ts           builds the Express app (no listen), so tests can import it
    server.ts        connects to MongoDB, starts listening, shuts down cleanly
    config/env.ts    zod-validated environment
    routes/ → controllers/ → (services/, from Phase 2)
    middleware/      central error handler, 404 handler
    errors/          AppError: the one error type that reaches clients
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

## Technical decisions

- **Express 5.** Errors thrown in route handlers, including async ones, reach the error handler without wrapper functions.
- **TypeScript 6.0, not 7.** typescript-eslint, which provides the type-aware lint rules, supports TypeScript only up to 6.0.
- **Vitest 4 and concurrently 9.** Their newer majors dropped Node 20, which the project still supports.
- **No dotenv.** Node's built-in `--env-file` flag loads `server/.env`, and `tsx watch` passes it through.
- **ESM throughout.** The server uses `"type": "module"` with `NodeNext` resolution, so relative imports end in `.js`.
