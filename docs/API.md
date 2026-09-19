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

The list and analytics endpoints take these as query parameters, and the export endpoint takes them as a JSON object. All three use the same set, validated by the same schema and turned into a database query by the same function (`buildTransactionQuery()`). A filter therefore means exactly the same thing in the table, the charts and a CSV. All filters are optional and combine with AND.

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

### `GET /api/analytics/summary`

The totals behind the dashboard cards and the breakdown charts, for the transactions matching the [filters](#filters). **Auth: JWT.** It takes the filter parameters only (no paging or sorting), and unknown parameters are rejected. It runs a single aggregation: one `$group` by category and status. Every figure is derived from those (at most four) buckets and rounded to cents.

**200 OK**: unfiltered, on the seed data.

```json
{
  "totals": {
    "revenue": 339803.25,
    "expense": 206605,
    "net": 133198.25,
    "pending": 205303,
    "pendingCount": 114,
    "count": 300
  },
  "byCategory": [
    { "key": "Revenue", "total": 339803.25, "count": 150 },
    { "key": "Expense", "total": 206605, "count": 150 }
  ],
  "byStatus": [
    { "key": "Paid", "revenue": 195302, "expense": 145803.25, "count": 186 },
    { "key": "Pending", "revenue": 144501.25, "expense": 60801.75, "count": 114 }
  ]
}
```

- **`net`** is revenue minus expense: the Balance card.
- **`pending`** is the pending amount across both categories.
- **Both categories and both statuses are always present**, with zeros when nothing matches.

```bash
curl -G http://localhost:4000/api/analytics/summary -H "Authorization: Bearer <token>" -d userIds=user_001
```

### `GET /api/analytics/trend`

Revenue and expense per UTC calendar month, for the Overview chart. **Auth: JWT.** It takes the filter parameters only.

**200 OK**

```json
{
  "points": [
    { "period": "2024-01-01T00:00:00.000Z", "revenue": 53100, "expense": 2150 },
    { "period": "2024-02-01T00:00:00.000Z", "revenue": 4300, "expense": 35901 },
    …
    { "period": "2024-12-01T00:00:00.000Z", "revenue": 2600, "expense": 28850.5 }
  ]
}
```

Shortened: the seed data gives 12 points, January to December 2024.

- **`period`** is the first instant of the month, in UTC.
- **Months without transactions appear with zeros**, so the chart's x-axis is continuous. The range runs from `dateFrom` (or the first month with data) to `dateTo` (or the last month with data).
- **`points` is empty when no transaction matches.**
- **Requires MongoDB 5.0 or later**, for `$dateTrunc`.

### `POST /api/transactions/export`

Streams the matching transactions as a CSV file. **Auth: JWT.** It is a POST because the column list and filters travel as JSON. The client downloads the response as a blob, because a plain link can't carry the `Authorization` header. Rows go from a database cursor straight into the response, so memory use stays flat however many rows match.

**Request body**

| Field     | Type                                                | Rules                                                                                                                      |
| --------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `columns` | array, required                                     | 1 or more of `id`, `date`, `amount`, `category`, `status`, `user_id`, `user_profile`, no repeats. The file uses this order |
| `filters` | object, default `{}`                                | The same [filters](#filters) as the table, with lists as arrays. `{}` exports every transaction                            |
| `sort`    | object, default `{ "by": "date", "order": "desc" }` | `by`: a sortable field (see the list endpoint). `order`: `asc` or `desc`                                                   |

```json
{
  "columns": ["id", "date", "amount", "status", "user_id"],
  "filters": { "dateFrom": "2024-03-01", "dateTo": "2024-03-31", "categories": ["Expense"] },
  "sort": { "by": "amount", "order": "desc" }
}
```

**200 OK** returns the CSV itself, with these headers:

```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="transactions_2024-03-01_to_2024-03-31.csv"
Cache-Control: no-store
```

```csv
ID,Date (UTC),Amount,Status,User ID
92,2024-03-15T11:22:49.000Z,3500.00,Paid,user_003
80,2024-03-06T18:32:45.000Z,3200.00,Paid,user_003
```

- **The header row** uses readable labels. It is written even when no rows match.
- **Dates** are ISO 8601 in UTC.
- **Amounts** have 2 decimals and no currency symbol, so spreadsheets read them as numbers.
- **Quoting:** values with commas, quotes or line breaks are quoted.
- **Formula protection:** a text value starting with `=`, `+`, `-`, `@`, tab or carriage return gets a leading apostrophe, so a spreadsheet shows it as text instead of running it as a formula.
- **The filename** names the date range (`transactions_2024-01-01_to_2024-03-31.csv`, `transactions_from_2024-07-01.csv`, `transactions_until_2024-06-30.csv`). With no range it uses the UTC time of export (`transactions_2026-09-19_1432.csv`).

**Errors**: the body is validated before any CSV is sent, so errors are normal JSON.

- **400 `VALIDATION_ERROR`:** no columns, a column outside the whitelist (such as `_id`), a repeated column, an invalid or unknown filter, or an unknown field.
- **401 `UNAUTHORIZED` / `TOKEN_EXPIRED`:** see [Conventions](#conventions).

```bash
curl -X POST http://localhost:4000/api/transactions/export   -H "Authorization: Bearer <token>" -H "Content-Type: application/json"   -d '{"columns":["id","date","amount","status"],"filters":{"statuses":["Pending"]}}'   -OJ   # save under the server's filename
```
