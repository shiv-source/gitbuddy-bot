# Security

Configure secret scanning, PAT age reminders, and security alerts.

## Options

### `alertChannel`

**Type:** `string` | **Default:** `""`

Channel or destination for security alerts. For Slack, use a channel name; for other integrations, use the configured destination.

```yaml
security:
  alertChannel: "#security-alerts"
```

### `maxPatAgeDays`

**Type:** `number` | **Default:** `90`

Maximum age (in days) of personal access tokens before GitBuddy Bot sends a reminder to rotate them.

```yaml
security:
  maxPatAgeDays: 60
```

### `scanForSecrets`

**Type:** `boolean` | **Default:** `true`

When enabled, scans commits, issues, and PRs for accidentally committed secrets (API keys, tokens, credentials).

```yaml
security:
  scanForSecrets: true
```

### `secretPatterns`

**Type:** `string[]` | **Default:** `[]`

Additional regex patterns to match when scanning for secrets. The bot already includes patterns for common credential formats.

```yaml
security:
  secretPatterns:
    - "AKIA[0-9A-Z]{16}"           # AWS access key
    - "sk-[a-zA-Z0-9]{32,}"        # OpenAI-style API key
```

### `blockSecretsOnPush`

**Type:** `boolean` | **Default:** `false`

When enabled, blocks pushes that contain detected secrets (requires branch protection integration).

```yaml
security:
  blockSecretsOnPush: true
```

### `alertOnNewCollaborator`

**Type:** `boolean` | **Default:** `false`

Sends an alert when a new collaborator is added to a repo.

```yaml
security:
  alertOnNewCollaborator: true
```

## Full Example

```yaml
security:
  alertChannel: "#security-alerts"
  maxPatAgeDays: 60
  scanForSecrets: true
  blockSecretsOnPush: true
  alertOnNewCollaborator: true
  secretPatterns:
    - "AKIA[0-9A-Z]{16}"
```
