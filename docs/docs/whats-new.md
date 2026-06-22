# What's New

Track the latest features, improvements, and fixes in GitBuddy Bot.

---

## 2026-06-22

### 🚀 Documentation Site

- **Custom domain**: Docs site now hosted at [gitbuddy-bot.shivkumar.me](https://gitbuddy-bot.shivkumar.me).
- **Branded logo**: New GitBuddy Bot logo — Git branch graph with friendly robot face.
- **Roadmap published**: [60 open issues](https://github.com/shiv-source/gitbuddy-bot/issues) catalogued across governance, automation, security, insights, AI copilot, integrations, release management, and platform domains.
- **What's New page**: This page — a running log of changes.

### 🏗️ Architecture

- **7 domain handlers**: Governance, Automation, Security, Sync, Insights, Copilot, and Stale — all extending `BaseHandler` with Template Method pattern.
- **5 slash commands**: `/shipit`, `/label`, `/triage`, `/merge`, `@gitbuddy summarize`.
- **Middleware chain**: Context Enricher → Rate Limiter → Error Handler → Domain Handlers.
- **SOLID layers**: Handlers → Services (pure business logic) → Infrastructure Adapters → GitHub API.
- **Per-event Octokit**: Installation-scoped, retry with exponential backoff, rate-limit aware.

### 🔧 Tooling

- **Makefile-driven**: `make install`, `make build`, `make dev`, `make test`, `make lint`, `make docs-dev`.
- **pnpm monorepo**: `app/` (Probot GitHub App) + `docs/` (Docusaurus).
- **Pre-commit graphify**: Knowledge graph auto-rebuilds on staged changes via git hook.
- **Strict TypeScript**: `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns` all enabled.

### 📊 Knowledge Graph

- **graphify integration**: 250 nodes, 1,458 edges across 54 files in 3 languages (TypeScript, bash, TSX).
- **83 communities** detected via Leiden clustering.
- **Auto-updates**: Pre-commit hook rebuilds the graph from staged changes.

---

## Coming Soon

See the [Roadmap](roadmap.md) for a full breakdown of 38 planned features and 22 known bugs.

| Priority | Item | Issue |
|----------|------|-------|
| 🔴 | Per-repo config (currently global) | [#39](https://github.com/shiv-source/gitbuddy-bot/issues/39) |
| 🔴 | Rate limiter fix — silent event loss | [#38](https://github.com/shiv-source/gitbuddy-bot/issues/38) |
| 🟠 | InversifyJS DI container | [#61](https://github.com/shiv-source/gitbuddy-bot/issues/61) |
| 🟠 | Real AI PR review | [#24](https://github.com/shiv-source/gitbuddy-bot/issues/24) |
| 🟠 | Health check endpoint | [#35](https://github.com/shiv-source/gitbuddy-bot/issues/35) |
| 🟡 | Slack notification integration | [#28](https://github.com/shiv-source/gitbuddy-bot/issues/28) |

---

_This page is updated with each significant release. Follow the [GitHub repo](https://github.com/shiv-source/gitbuddy-bot) for real-time updates._
