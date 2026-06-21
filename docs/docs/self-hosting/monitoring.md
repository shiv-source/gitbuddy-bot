# Monitoring

Monitor your GitBuddy Bot deployment.

## Health Check

GitBuddy Bot exposes a health endpoint:

```
GET /health
```

**Response (200):**
```json
{
  "status": "ok",
  "uptime": 123456,
  "events_processed": 1042,
  "errors": 3,
  "last_event_at": "2025-06-21T12:34:56Z"
}
```

Use this endpoint with uptime monitoring tools like Pingdom, Better Uptime, or Checkly.

## Logging

Logs are written to stdout in structured JSON (when `NODE_ENV=production`) or human-readable format (development).

### Log Levels

Set via `LOG_LEVEL` env var:

| Level | What You See |
|-------|-------------|
| `debug` | Full event payloads, config resolution, API requests |
| `info` | Events received, actions taken, errors caught |
| `warn` | Rate limits hit, transient failures, deprecation warnings |
| `error` | Handler failures, API errors, configuration problems |

### Log Aggregation

Forward logs to:
- **Railway / Render** — built-in log viewers
- **Fly.io** — `fly logs`
- **Papertrail / Logtail** — use a log shipper
- **Datadog / New Relic** — use their Node.js agents
- **Sentry** — set `SENTRY_DSN` for error tracking

## Metrics

Key metrics to watch:

| Metric | What It Means |
|--------|--------------|
| **Events processed** | Webhook events handled successfully |
| **Errors** | Failed event processing |
| **Response time** | GitHub API call latency |
| **Rate limit hits** | GitHub API rate limit exhaustion |
| **Stale issues marked/closed** | Stale sweep effectiveness |

## Alerting

Configure alerts for:
- Health endpoint returning non-200
- Error rate exceeding 5% of events
- GitHub API rate limit approaching exhaustion (check `X-RateLimit-Remaining` headers)
- Stale sweep not running (no events for > 24 hours)

## Troubleshooting

### Bot not responding to events

1. Check webhook deliveries in GitHub App settings (Settings → Developer settings → GitHub Apps → Advanced → Recent Deliveries)
2. Verify the webhook URL is correct and accessible
3. Check logs for errors

### GitHub API rate limit errors

1. Check `X-RateLimit-Remaining` in API responses
2. Increase `MAX_CONCURRENT_EVENTS` to spread load
3. Consider requesting a higher rate limit from GitHub

### Config not being picked up

1. Verify `.github/gitbuddy.yml` is in the correct repo
2. Check the file is valid YAML
3. Check logs for `ConfigError` messages
4. Wait for config cache refresh (`CONFIG_REFRESH_SECONDS`, default 5 min)
