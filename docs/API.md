# Ledgerline API

This file is updated at the end of every phase. It documents only the endpoints that exist now.

## Conventions

- **Base URL**: `http://localhost:4000/api`. In development the client calls `http://localhost:5173/api`, which Vite proxies to the server.
- **Authentication**: endpoints marked _JWT_ need `Authorization: Bearer <token>`, using the token from `POST /api/auth/login`. Tokens are HS256 and expire after `JWT_EXPIRES_IN` (default 8 hours). There is no logout endpoint: the client discards the token.
- **Bodies**: JSON, at most 100 KB.
- **CORS**: only `CLIENT_ORIGIN` (default `http://localhost:5173`) is allowed. `Content-Disposition` is exposed so the client can read export filenames.
- **Security headers**: set by helmet on every response.

## Errors

Every error uses the same shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [{ "path": "page", "message": "Too small: expected number to be >=1" }]
  }
}
```

`details` appears only when there is something specific to report. For validation errors it lists one `{ path, message }` per problem.

| Code                  | Status | When                                                                              |
| --------------------- | ------ | --------------------------------------------------------------------------------- |
| `VALIDATION_ERROR`    | 400    | Invalid input, including a request body that isn't valid JSON                     |
| `UNAUTHORIZED`        | 401    | Missing, malformed or invalid token, or the token's user no longer exists         |
| `TOKEN_EXPIRED`       | 401    | The token was valid but has expired. The client should log in again               |
| `INVALID_CREDENTIALS` | 401    | Login failed. The same response is used for an unknown email and a wrong password |
| `NOT_FOUND`           | 404    | The route doesn't exist                                                           |
| `PAYLOAD_TOO_LARGE`   | 413    | The request body is over 100 KB                                                   |
| `RATE_LIMITED`        | 429    | Too many failed logins. `details.retryAfterSeconds` says when to retry            |
| `INTERNAL_ERROR`      | 500    | Unexpected failure. The message is generic; details stay in the server log        |
| `SERVICE_UNAVAILABLE` | 503    | The database isn't connected                                                      |

## Resources

These are the objects the endpoints return.

### Transaction

```json
{
  "id": 1,
  "date": "2024-01-15T08:34:12.000Z",
  "amount": 1500,
  "category": "Revenue",
  "status": "Paid",
  "user_id": "user_001",
  "user_profile": "https://thispersondoesnotexist.com/"
}
```

| Field          | Type   | Notes                                                                                           |
| -------------- | ------ | ----------------------------------------------------------------------------------------------- |
| `id`           | number | Unique id from the source data. MongoDB's internal `_id` is never exposed                       |
| `date`         | string | ISO 8601, always UTC. Filtering and grouping by day also use UTC                                |
| `amount`       | number | Always positive, up to 2 decimals. `category` decides the sign: Revenue adds, Expense subtracts |
| `category`     | string | `Revenue` or `Expense`                                                                          |
| `status`       | string | `Paid` or `Pending`                                                                             |
| `user_id`      | string | `user_001` to `user_004` in the sample data                                                     |
| `user_profile` | string | URL from the source data. Stored and exportable. The UI shows initials instead of loading it    |

### User

```json
{ "id": "66f0c0ffee0000000000abcd", "email": "analyst@example.com", "name": "Demo Analyst" }
```

`email` is stored lowercase. The password is kept only as a bcrypt hash, and the database never returns it unless a query explicitly asks for it. No endpoint includes it.

## Endpoints

### `GET /api/health`

Reports whether the API is up and connected to MongoDB. No authentication.

**200 OK**

```json
{ "status": "ok", "db": "connected" }
```

**503 Service Unavailable**: the server is running but has no database connection.

```json
{ "error": { "code": "SERVICE_UNAVAILABLE", "message": "Database is not connected" } }
```

Example:

```bash
curl http://localhost:4000/api/health
```

### `POST /api/auth/login`

Exchanges an email and password for a token. No authentication. The route is rate-limited: after **10 failed attempts in 15 minutes** from one IP address, further attempts get a 429 until the window resets. Successful logins don't count toward the limit.

**Request body**

| Field      | Type   | Rules                                                                      |
| ---------- | ------ | -------------------------------------------------------------------------- |
| `email`    | string | A valid email, max 254 characters. Case and surrounding spaces are ignored |
| `password` | string | 1–128 characters                                                           |

**200 OK**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2026-09-19T19:30:00.000Z",
  "user": {
    "id": "66f0c0ffee0000000000abcd",
    "email": "analyst@example.com",
    "name": "Demo Analyst"
  }
}
```

**Errors**

- **400 `VALIDATION_ERROR`:** a field is missing or malformed. `details` names each field.
- **401 `INVALID_CREDENTIALS`:** `"Email or password is incorrect"`. The response is identical whether the email is unknown or the password is wrong, and both take the same time: an unknown email is still checked against a dummy bcrypt hash.
- **429 `RATE_LIMITED`:** too many failed attempts. The body includes `details.retryAfterSeconds`.

Every response on this route also carries the standard rate-limit headers, for example `RateLimit: "10-in-15min"; r=8; t=900` (`r` is the number of attempts remaining and `t` the seconds until reset).

Examples, using the demo user from `server/.env`:

```bash
# bash / Git Bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"analyst@example.com","password":"your-demo-password"}'
```

```powershell
# Windows PowerShell: logs in, then calls /me with the token
$login = Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/auth/login `
  -ContentType 'application/json' `
  -Body '{"email":"analyst@example.com","password":"your-demo-password"}'
Invoke-RestMethod -Uri http://localhost:4000/api/auth/me -Headers @{ Authorization = "Bearer $($login.token)" }
```

### `GET /api/auth/me`

Returns the user the token belongs to. The client uses it on startup to check that a stored token is still valid. **Auth: JWT.**

**200 OK**

```json
{
  "user": {
    "id": "66f0c0ffee0000000000abcd",
    "email": "analyst@example.com",
    "name": "Demo Analyst"
  }
}
```

**Errors**

- **401 `UNAUTHORIZED`:**
  - No `Authorization` header, or a scheme other than `Bearer`.
  - A malformed token, or one with a bad signature.
  - A token using any algorithm other than HS256, including `alg: none`.
  - A token whose user has since been deleted.
- **401 `TOKEN_EXPIRED`:** the token was valid but has expired.

```bash
curl http://localhost:4000/api/auth/me -H "Authorization: Bearer <token>"
```

### Filters

The list endpoint below takes these parameters. The analytics and export endpoints use the same set, validated by the same schema and turned into a database query by the same function (`buildTransactionQuery()`). A filter therefore means exactly the same thing in the table, the charts and a CSV. All filters are optional and combine with AND.

| Parameter    | Format                               | Matches                                                                                                                                                                             |
| ------------ | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search`     | text, max 100 characters             | Case-insensitive "contains" on `user_id`, `category` and `status`. A number (`1500`, `1,500.50`, `$150`) also matches an exact `id` or `amount`. Special characters match literally |
| `dateFrom`   | `YYYY-MM-DD`                         | On or after the start of that UTC day                                                                                                                                               |
| `dateTo`     | `YYYY-MM-DD`                         | On or before the end of that UTC day (inclusive). Must not be before `dateFrom`                                                                                                     |
| `amountMin`  | number ≥ 0                           | `amount >= amountMin`                                                                                                                                                               |
| `amountMax`  | number ≥ 0                           | `amount <= amountMax`. Must not be below `amountMin`                                                                                                                                |
| `categories` | comma-separated: `Revenue,Expense`   | Any listed category                                                                                                                                                                 |
| `statuses`   | comma-separated: `Paid,Pending`      | Any listed status                                                                                                                                                                   |
| `userIds`    | comma-separated: `user_001,user_002` | Any listed user                                                                                                                                                                     |

Notes:

- **Lists** can be comma-separated or repeated (`statuses=Paid&statuses=Pending`). In JSON bodies they are arrays.
- **Empty values** (`search=`) count as not set.
- **Unknown parameters are rejected** with a 400. A misspelled filter (`statuss=Paid`) must never silently return unfiltered data.

### `GET /api/transactions`

One page of transactions matching the filters. **Auth: JWT.** Filtering, search, sorting and paging all happen in the database. The page and the total count run as two parallel queries.

**Query parameters**: every filter above, plus:

| Parameter   | Default | Rules                                                                                  |
| ----------- | ------- | -------------------------------------------------------------------------------------- |
| `page`      | `1`     | Whole number ≥ 1. A page past the end returns `data: []` with the real totals          |
| `pageSize`  | `10`    | Whole number, 1–100                                                                    |
| `sortBy`    | `date`  | One of `id`, `date`, `amount`, `category`, `status`, `user_id`. Anything else is a 400 |
| `sortOrder` | `desc`  | `asc` or `desc`                                                                        |

Rows with equal sort values are ordered by `id` in the same direction, so paging never repeats or skips a row.

**200 OK**

```json
{
  "data": [
    {
      "id": 24,
      "date": "2024-12-23T17:05:03.000Z",
      "amount": 2100,
      "category": "Expense",
      "status": "Paid",
      "user_id": "user_004",
      "user_profile": "https://thispersondoesnotexist.com/"
    }
  ],
  "meta": { "page": 1, "pageSize": 10, "total": 300, "totalPages": 30 }
}
```

**Errors**

- **400 `VALIDATION_ERROR`:** an invalid or unknown parameter. `details` names each one, e.g. `{ "path": "sortBy", "message": "Invalid option: ..." }`.
- **401 `UNAUTHORIZED` / `TOKEN_EXPIRED`:** see [Authentication](#conventions).

Example: pending expenses in the first quarter, largest first.

```bash
curl -G http://localhost:4000/api/transactions   -H "Authorization: Bearer <token>"   -d statuses=Pending -d categories=Expense   -d dateFrom=2024-01-01 -d dateTo=2024-03-31   -d sortBy=amount -d sortOrder=desc -d pageSize=25
```

### `GET /api/transactions/filter-options`

Everything the filter UI needs to offer valid choices. **Auth: JWT.** Categories and statuses come from the schema, so every valid value is listed. Users and the date and amount ranges come from the data. Both ranges are `null` when there are no transactions.

**200 OK**

```json
{
  "categories": ["Revenue", "Expense"],
  "statuses": ["Paid", "Pending"],
  "userIds": ["user_001", "user_002", "user_003", "user_004"],
  "dateRange": { "min": "2024-01-02T14:17:03.000Z", "max": "2024-12-23T17:05:03.000Z" },
  "amountRange": { "min": 150, "max": 5000 }
}
```
