# GitBuddy Bot 🤖

[![CI](https://github.com/shiv-source/gitbuddy-bot/actions/workflows/ci.yml/badge.svg)](https://github.com/shiv-source/gitbuddy-bot/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-gitbuddy.dev-blue)](https://shiv-source.github.io/gitbuddy-bot)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%E2%89%A524-brightgreen.svg)](https://nodejs.org)

> 📚 **Full documentation:** [shiv-source.github.io/gitbuddy-bot](https://shiv-source.github.io/gitbuddy-bot)

Monolithic GitHub App for org-wide governance, PR/issue automation, security scanning, cross-repo orchestration, DORA insights, and AI copilot integration.

## Quick Links

| | Link |
|---|---|
| 📖 **Docs** | [gitbuddy-bot docs site](https://shiv-source.github.io/gitbuddy-bot) |
| 🚀 **Quick Start** | [5-minute setup](https://shiv-source.github.io/gitbuddy-bot/docs/quick-start) |
| ⚙️ **Config Reference** | [All config options](https://shiv-source.github.io/gitbuddy-bot/docs/configuration/reference) |
| 🏗️ **Architecture** | [Design overview](https://shiv-source.github.io/gitbuddy-bot/docs/architecture/overview) |
| 🤝 **Contributing** | [How to contribute](CONTRIBUTING.md) |
| 🔒 **Security** | [Security policy](SECURITY.md) |

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
      - run: echo "Triggering GitBuddy Bot stale sweep"
```

When the workflow completes successfully, GitBuddy Bot picks up the `workflow_run.completed` event and executes the stale sweep:

- **From `.github` repo**: sweeps ALL repos in the org
- **From any other repo**: sweeps only that repo

Any workflow whose name contains "stale-sweep" or "mark stale" (case-insensitive) will trigger the sweep.

## Getting Started

```bash
git clone https://github.com/shiv-source/gitbuddy-bot.git
cd gitbuddy-bot
pnpm install
pnpm run typecheck
pnpm test
pnpm run build
pnpm start
```

For full setup instructions, see the [Quick Start guide](https://shiv-source.github.io/gitbuddy-bot/docs/quick-start).

## Configuration

Place a `.github/gitbuddy.yml` in your org's `.github` repo:

```yaml
governance:
  autoBootstrapPatterns: ["service-.*", "lib-.*"]
  requiredStatusChecks: ["security-codeql", "lint"]
  requiredReviewCount: 1

automation:
  defaultIssueLabels: ["triage"]
  staleAfterDays: 60
  closeAfterDays: 7
  staleLabel: "stale"

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

See the [Configuration Reference](https://shiv-source.github.io/gitbuddy-bot/docs/configuration/reference) for every option.

## Documentation

```bash
pnpm run docs:dev    # Start docs dev server
pnpm run docs:build  # Build docs site
pnpm run docs:deploy # Deploy to GitHub Pages
pnpm run docs:api    # Generate API reference (TypeDoc)
```

## License

MIT — see [LICENSE](LICENSE).
