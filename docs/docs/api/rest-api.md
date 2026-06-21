# REST API

GitBuddy Bot's own HTTP endpoints (beyond the Probot webhook handler).

## Health Check

```
GET /health
```

Returns the bot's health status.

**Response (200 OK):**

```json
{
  "status": "ok",
  "uptime": 123456,
  "events_processed": 1042,
  "errors": 3,
  "last_event_at": "2025-06-21T12:34:56Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | `string` | `"ok"` or `"degraded"` |
| `uptime` | `number` | Seconds since process start |
| `events_processed` | `number` | Total events handled since start |
| `errors` | `number` | Total errors since start |
| `last_event_at` | `string \| null` | ISO 8601 timestamp of most recent event |

## Webhook

```
POST /webhook
```

GitHub webhook receiver. Handled by Probot — no direct access needed. Requests are verified using the `WEBHOOK_SECRET`.

**Headers:**

| Header | Description |
|--------|-------------|
| `X-GitHub-Event` | Event type (e.g., `issues`, `pull_request`) |
| `X-Hub-Signature-256` | HMAC-SHA256 signature of the payload |
| `X-GitHub-Delivery` | Unique delivery ID |

**Response:** `200 OK` on successful processing.

## Rate Limiting

The bot includes built-in rate limiting for API consumers (not GitHub API rate limits):

- Default: 10 requests per second per IP
- Configurable via `MAX_CONCURRENT_EVENTS` env var
- Returns `429 Too Many Requests` with `Retry-After` header when exceeded

## Error Responses

| Status | Meaning |
|--------|---------|
| `200` | Success |
| `400` | Invalid webhook payload |
| `401` | Invalid webhook signature |
| `429` | Rate limited |
| `500` | Internal server error |
