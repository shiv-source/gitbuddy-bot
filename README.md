# Watchdog Pro 🐶

Monolithic GitHub App for org-wide governance, PR/issue automation, security scanning, cross-repo orchestration, DORA insights, and AI copilot integration.

## Architecture

```
src/
  core/              # Abstractions: interfaces, types, errors (SOLID foundation)
  infrastructure/    # Concrete adapters: Probot, Octokit, YAML config, cache
  handlers/          # 7 domain event handlers (one per domain, S in SOLID)
  commands/          # /command bot (Command Pattern)
  services/          # Pure business logic — StaleService, etc. (no framework dep)
  middleware/         # Chain of Responsibility: enrich → rate-limit → error-handle
  app.ts             # Application class — wires handlers to events
  index.ts           # Composition root — picks concrete implementations
```

## Design Patterns

| Pattern | Where |
|---|---|
| Template Method | `handlers/base-handler.ts` |
| Command | `commands/*.ts` |
| Strategy | `infrastructure/*` (swap adapters behind interfaces) |
| Chain of Responsibility | `middleware/*` |
| Adapter | `infrastructure/github/octokit-client.ts` |
| Factory / DI | `src/index.ts` (composition root) |

## Scheduled Sweeps

The stale issue lifecycle runs on a schedule via a GitHub Actions workflow. Create `.github/workflows/stale-sweep.yml` in your org's `.github` repo:

```yaml
name: stale-sweep
on:
  schedule:
    - cron: '0 9 * * 1'   # every Monday at 9am UTC
  workflow_dispatch:       # allow manual trigger

jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Triggering Watchdog Pro stale sweep"
```

When the workflow completes successfully, Watchdog Pro picks up the `workflow_run.completed` event and executes the stale sweep:

- **From `.github` repo**: sweeps ALL repos in the org
- **From any other repo**: sweeps only that repo

Any workflow whose name contains "stale-sweep" or "mark stale" (case-insensitive) will trigger the sweep.

## Getting Started

```bash
cd github-apps/watchdog-pro
npm install
npm run typecheck
npm test
npm run build
npm start
```

## Configuration

Place a `.github/watchdog.yml` in your org's `.github` repo:

```yaml
governance:
  autoBootstrapPatterns: ["service-.*", "lib-.*"]
  requiredStatusChecks: ["security-codeql", "lint"]
  requiredReviewCount: 1

automation:
  defaultIssueLabels: ["triage"]
  staleAfterDays: 60
  closeAfterDays: 7
  staleLabel: "stale"          # label applied to stale issues

security:
  alertChannel: "#security-alerts"
  maxPatAgeDays: 90

sync:
  downstreamRepos:
    "my-org/shared-lib": ["my-org/service-a", "my-org/service-b"]

insights:
  collectDoraMetrics: true
  ciHealthThreshold: 0.9

copilot:
  prReviewEnabled: false
  prDescriptionEnabled: true
  maxTokens: 4096
```
