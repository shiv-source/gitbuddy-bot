# Integrations

Configure external integrations: Slack, Jira, Linear webhooks.

## Options

### `slack`

**Type:** `object` | **Default:** `{}`

Slack integration configuration.

```yaml
integrations:
  slack:
    webhookUrl: "https://hooks.slack.com/services/..."
    channel: "#gitbuddy-alerts"
    notifyOn: ["stale", "security", "digest"]
```

| Sub-key | Type | Description |
|---------|------|-------------|
| `webhookUrl` | `string` | Slack incoming webhook URL |
| `channel` | `string` | Default channel for notifications |
| `notifyOn` | `string[]` | Event types to notify on: `stale`, `security`, `digest`, `deploy` |

### `jira`

**Type:** `object` | **Default:** `{}`

Jira integration for issue syncing.

```yaml
integrations:
  jira:
    baseUrl: "https://your-org.atlassian.net"
    email: "bot@your-org.com"
    apiToken: "${JIRA_API_TOKEN}"  # Use env var reference
    projectKey: "DEV"
```

| Sub-key | Type | Description |
|---------|------|-------------|
| `baseUrl` | `string` | Jira instance URL |
| `email` | `string` | Bot account email |
| `apiToken` | `string` | API token (use env var reference) |
| `projectKey` | `string` | Default Jira project key |

### `linear`

**Type:** `object` | **Default:** `{}`

Linear integration for issue tracking.

```yaml
integrations:
  linear:
    apiKey: "${LINEAR_API_KEY}"  # Use env var reference
    teamId: "TEAM_ID"
```

| Sub-key | Type | Description |
|---------|------|-------------|
| `apiKey` | `string` | Linear API key (use env var reference) |
| `teamId` | `string` | Default Linear team ID |

## Full Example

```yaml
integrations:
  slack:
    webhookUrl: "https://hooks.slack.com/services/..."
    channel: "#gitbuddy-alerts"
    notifyOn: ["stale", "security"]
  jira:
    baseUrl: "https://your-org.atlassian.net"
    email: "bot@your-org.com"
    apiToken: "${JIRA_API_TOKEN}"
    projectKey: "DEV"
  linear:
    apiKey: "${LINEAR_API_KEY}"
    teamId: "TEAM_ID"
```

## Environment Variable References

Use `${ENV_VAR_NAME}` syntax to reference environment variables in config values. This keeps secrets out of your committed config file.
