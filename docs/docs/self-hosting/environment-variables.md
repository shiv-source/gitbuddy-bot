# Environment Variables

All environment variables used by GitBuddy Bot.

## Required

| Variable | Description |
|----------|-------------|
| `APP_ID` | GitHub App ID (from the app settings page) |
| `PRIVATE_KEY` | GitHub App private key (PEM format) |
| `WEBHOOK_SECRET` | Webhook secret for verifying payload signatures |

## Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP server port |
| `LOG_LEVEL` | `info` | Logging level: `debug`, `info`, `warn`, `error` |
| `NODE_ENV` | `production` | Environment: `development`, `production`, `test` |
| `SENTRY_DSN` | — | Sentry DSN for error tracking |
| `REDIS_URL` | — | Redis connection for persistent cache (falls back to memory) |
| `GITHUB_ENTERPRISE_URL` | — | GitHub Enterprise Server URL (for GHE deployments) |
| `HEALTH_CHECK_PORT` | `PORT` | Separate port for health endpoint |
| `REQUEST_TIMEOUT_MS` | `10000` | Timeout for GitHub API requests |
| `MAX_CONCURRENT_EVENTS` | `10` | Max concurrent event processing |
| `CONFIG_REFRESH_SECONDS` | `300` | How often to refresh config cache |

## Setting Variables

### Railway / Render
Add in the dashboard under **Environment** or **Environment Variables**.

### Fly.io
```bash
fly secrets set APP_ID=12345 PRIVATE_KEY="$(cat key.pem)" WEBHOOK_SECRET="secret"
```

### VPS / Systemd
Add to `/etc/environment` or use a `.env` file with your process manager.

### Local Development
Create a `.env` file (gitignored):

```bash
APP_ID=12345
PRIVATE_KEY="$(cat private-key.pem)"
WEBHOOK_SECRET=dev-secret
PORT=3000
LOG_LEVEL=debug
```

## Private Key Format

The `PRIVATE_KEY` must include the full PEM content with newlines. Use a quoted string:

```bash
PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
-----END RSA PRIVATE KEY-----"
```

Or base64-encode it and decode at startup if your platform doesn't support multiline env vars.
