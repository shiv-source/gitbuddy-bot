# Quick Start

Get GitBuddy Bot running in your org in 5 minutes.

## 1. Install the GitHub App

Install **GitBuddy Bot** from the GitHub Marketplace onto your organization. Give it access to:

- **All repositories** (recommended) or select specific repos
- Required permissions: Issues (Read & write), Pull requests (Read & write), Contents (Read), Metadata (Read), Checks (Read & write)

## 2. Create the Config File

Create `.github/gitbuddy.yml` in your org's `.github` repository:

```yaml
governance:
  autoBootstrapPatterns: ["service-.*", "lib-.*"]
  requiredStatusChecks: ["lint", "typecheck", "test"]
  requiredReviewCount: 1

automation:
  defaultIssueLabels: ["triage"]
  staleAfterDays: 60
  closeAfterDays: 7
  staleLabel: "stale"

security:
  alertChannel: "#security-alerts"
  maxPatAgeDays: 90

insights:
  collectDoraMetrics: true
  ciHealthThreshold: 0.9

copilot:
  prReviewEnabled: false
  prDescriptionEnabled: true
  maxTokens: 4096
```

**Minimal config** — just enable what you need:

```yaml
automation:
  defaultIssueLabels: ["triage"]
  staleAfterDays: 60
```

See the full [Configuration Reference](configuration/reference.md) for every option.

## 3. Verify It's Working

1. **Create a test issue** in any repo. It should get the `triage` label applied within seconds.
2. **Open a PR** — if `prDescriptionEnabled: true`, the bot will add a description template comment.
3. **Check the health endpoint** — `GET https://<your-bot-url>/health` should return `200`.

## 4. Set Up Stale Sweeps (Optional)

Create `.github/workflows/stale-sweep.yml` in your `.github` repo:

```yaml
name: stale-sweep
on:
  schedule:
    - cron: '0 9 * * 1'   # every Monday at 9am UTC
  workflow_dispatch:

jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Triggering stale sweep"
```

When this workflow completes, GitBuddy Bot picks up the `workflow_run.completed` event and runs the stale sweep across your org.

## Next Steps

- [Configuration deep-dive](configuration/overview.md) — understand every config option
- [Commands](commands/overview.md) — learn slash commands like `/shipit` and `/triage`
- [Self-hosting](self-hosting/prerequisites.md) — deploy your own instance
