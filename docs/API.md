# Ledgerline API

This file is updated at the end of every phase. It documents only the endpoints that exist now.

## Conventions

- **Base URL**: `http://localhost:4000/api`. In development the client calls `http://localhost:5173/api`, which Vite proxies to the server.
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

| Code                  | Status | When                                                                       |
| --------------------- | ------ | -------------------------------------------------------------------------- |
| `VALIDATION_ERROR`    | 400    | Invalid input, including a request body that isn't valid JSON              |
| `NOT_FOUND`           | 404    | The route doesn't exist                                                    |
| `PAYLOAD_TOO_LARGE`   | 413    | The request body is over 100 KB                                            |
| `INTERNAL_ERROR`      | 500    | Unexpected failure. The message is generic; details stay in the server log |
| `SERVICE_UNAVAILABLE` | 503    | The database isn't connected                                               |

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
