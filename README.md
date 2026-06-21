# GitBuddy Bot 🤖

<div align="center">

[![CI](https://github.com/shiv-source/gitbuddy-bot/actions/workflows/ci.yml/badge.svg)](https://github.com/shiv-source/gitbuddy-bot/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-gitbuddy.dev-blue)](https://shiv-source.github.io/gitbuddy-bot)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%E2%89%A524-brightgreen.svg)](https://nodejs.org)

**One bot to govern, automate, secure, sync, and measure your GitHub org.**

📚 **Full documentation:** [shiv-source.github.io/gitbuddy-bot](https://shiv-source.github.io/gitbuddy-bot)

</div>

---

## What is GitBuddy Bot?

GitBuddy Bot is a **monolithic Probot GitHub App** that installs on your GitHub organization and provides **seven domains** of automation out of the box:

| Domain | What it does |
|---|---|
| 🏛️ **Governance** | Auto-bootstrap repos with branch protection rules |
| ⚙️ **Automation** | Auto-label issues/PRs, auto-assign reviewers |
| 🔒 **Security** | Log secret scanning alerts, scan commits for credentials |
| 🔄 **Sync** | Dispatch workflows to downstream repos, notify integrations |
| 📊 **Insights** | Track CI health and compute DORA metrics (lead time, failure rate) |
| 🤖 **Copilot** | AI-generated PR descriptions, respond to `@gitbuddy` mentions |
| 🕐 **Stale** | Two-phase stale issue sweeps across your org |

All behavior is driven by a single [`.github/gitbuddy.yml`](https://shiv-source.github.io/gitbuddy-bot/docs/configuration) config file — no code changes needed to customize per org. Every domain is **disabled by default** until you enable it.

---

## Quick Start

### Prerequisites

- **Node.js** >= 24
- **pnpm** >= 11
- **uv** (optional — installed automatically by `make setup`)

### One-command setup (recommended)

```bash
git clone https://github.com/shiv-source/gitbuddy-bot.git
cd gitbuddy-bot
make setup          # Installs uv, graphify, code-review-graph, MCP servers, pnpm deps, git hooks
```

`make setup` handles everything: Python toolchain, knowledge graphs, Claude Code MCP servers, project dependencies, and Husky git hooks. Use `make setup-ci` for CI environments (skips MCP registration).

### Manual install

```bash
make install        # Install workspace dependencies (pnpm)
make build          # Compile TypeScript (tsc)
make start          # Run the app (node dist/index.js)
```

### Development

```bash
make dev            # TypeScript watch mode (recompiles on changes)
make test           # Run all tests with coverage
make test-unit      # Unit tests only
make lint           # ESLint
make typecheck      # TypeScript type checking (noEmit)
make clean          # Remove dist/ and coverage/
```

### Knowledge Graphs

```bash
make graph-update   # Incremental graphify rebuild (code-only, no LLM)
make graph-rebuild  # Full rebuild of both graphs (graphify + code-review-graph)
make mcp-check      # Verify MCP server connections
make mcp-register   # Register MCP servers with Claude Code
```

### Docs Site

```bash
make docs-dev       # Start Docusaurus docs site locally
make docs-build     # Build static docs
make docs-api       # Generate TypeDoc API reference
```

---

## Configuration

Drop a `.github/gitbuddy.yml` in your org's `.github` repo (or any repo) and GitBuddy picks it up automatically. Here's a representative config with all sections shown:

```yaml
governance:
  autoBootstrapPatterns: ["*-service", "*-lib"]
  requiredStatusChecks: ["ci", "lint"]
  requiredReviewCount: 1

automation:
  defaultIssueLabels: ["triage"]
  labelRules:
    - pattern: "bug"
      labels: ["bug", "needs-triage"]
  staleAfterDays: 60
  closeAfterDays: 7
  staleLabel: "stale"

security:
  excludePatterns: ["docs/", "*.md"]
  maxPatAgeDays: 90

sync:
  downstreamRepos:
    "my-org/api-service":
      - "my-org/client-sdk"
      - "my-org/mobile-app"

insights:
  collectDoraMetrics: true
  ciHealthThreshold: 0.9

copilot:
  prDescriptionEnabled: true
  prReviewEnabled: false
  maxTokens: 4096
```

Every key has a sensible default — you only need to configure what you want to enable. See the [full configuration reference](https://shiv-source.github.io/gitbuddy-bot/docs/configuration) for details.

---

## Slash Commands

GitBuddy responds to slash commands posted in issue and PR comments:

| Command | What it does |
|---|---|
| `/shipit` | Merge a PR after all required checks pass |
| `/label <name>` | Add a label to an issue or PR |
| `/label -<name>` | Remove a label from an issue or PR |
| `/triage` | Apply the default triage labels |

Commands use the **Command Pattern** with a pluggable `CommandRouter` — adding a new command means one new file implementing `ICommand` and one registration line in the composition root.

---

## Architecture

GitBuddy follows **Domain-Driven Design** with **SOLID** layering and a composition root for dependency injection:

```
GitHub Webhook
  → Context Enricher      (normalize repo/org/sender)
    → Rate Limiter         (per-event concurrency cap)
      → Error Handler      (classify and handle errors)
        → Domain Handlers  (7 handlers — one per domain)
          → Services        (pure business logic)
            → Adapters      (Octokit, YAML, Cache, Logger)
              → GitHub API
```

**Key design principles:**

- **Zero framework leakage** — the `core/` layer never imports Probot, Octokit, or any framework code. Handlers only see domain abstractions (`IGitHubClient`, `IConfigProvider`, etc.).
- **Template Method pattern** — every handler extends `BaseHandler` which enforces a consistent `validate → enrich → process → respond` pipeline.
- **Composition root** — all dependencies are wired in `src/index.ts` using manual DI. No magic, fully traceable.
- **Adapter pattern** — infrastructure concerns (Octokit, YAML, caching, logging) are behind interfaces, making them swappable and testable.

### Source Layout

```
app/src/
  core/              Interfaces, types, error hierarchy (zero framework deps)
  handlers/          7 domain handlers extending BaseHandler
  commands/          Slash commands + CommandRouter
  services/          Pure business logic (StaleService)
  middleware/        Context enricher, rate limiter, error handler
  infrastructure/    Octokit, YAML config, memory cache, logger adapters
```

---

## Monorepo Structure

```
gitbuddy-bot/
├── app/                          # Probot GitHub App
│   ├── src/
│   │   ├── core/                 # Interfaces, types, error hierarchy
│   │   ├── handlers/             # 7 domain handlers
│   │   ├── commands/             # Slash commands + CommandRouter
│   │   ├── services/             # Pure business logic
│   │   ├── middleware/           # Context enricher, rate limiter, error handler
│   │   └── infrastructure/       # Octokit, YAML, cache, logger adapters
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── handlers/
│   │   │   └── services/
│   │   └── integration/
│   ├── app.yml                   # GitHub App manifest
│   ├── tsconfig.json
│   ├── jest.config.cjs
│   └── package.json
├── docs/                         # Docusaurus documentation site
│   ├── docs/
│   │   ├── api/                  # GitHub events, interfaces, REST API reference
│   │   ├── architecture/         # DI, handlers, middleware, services
│   │   ├── commands/             # Slash command docs
│   │   ├── configuration/        # Per-domain config reference
│   │   ├── contributing/         # Setup, code style, testing, workflow
│   │   └── self-hosting/         # Deployment, env vars, GitHub App setup
│   ├── docusaurus.config.ts
│   ├── sidebars.ts
│   └── package.json
├── scripts/                      # Automation and setup scripts
│   ├── setup.sh                  # One-command team onboarding
│   ├── graphify-pre-commit.sh    # Pre-commit hook: rebuild + stage graph
│   └── graphify-post-checkout.sh # Post-checkout hook: rebuild on branch switch
├── .husky/                       # Husky-managed git hooks (portable)
│   ├── _/                        # Husky internal shim
│   ├── pre-commit                # → scripts/graphify-pre-commit.sh
│   └── post-checkout             # → scripts/graphify-post-checkout.sh
├── .github/
│   ├── workflows/                # CI (docs-deploy)
│   ├── ISSUE_TEMPLATE/
│   ├── pull_request_template.md
│   └── CODEOWNERS
├── graphify-out/                 # Graphify knowledge graph (tracked in git)
│   ├── graph.json                # Knowledge graph data
│   ├── graph.html                # Interactive visualization
│   ├── GRAPH_REPORT.md           # Human-readable architecture report
│   └── wiki/                     # Per-community wiki pages
├── .code-review-graph/           # Code-review-graph data
├── .claude/                      # Claude Code project settings
│   └── settings.json             # Hooks, MCP server config
├── .nvmrc                        # Node version (24)
├── .npmrc                        # engine-strict=true, pnpm config
├── .gitignore
├── Makefile                      # All commands: setup, build, test, lint, docs, graphs
├── pnpm-workspace.yaml           # pnpm workspace (app + docs)
├── pnpm-lock.yaml
├── package.json                  # Root — workspace scripts + husky + engines
├── CLAUDE.md                     # Guidance for Claude Code
├── README.md
├── LICENSE
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
└── SECURITY.md
```

All commands run via `make` from the repo root — see `make help` for the full list. Git hooks (pre-commit, post-checkout) auto-rebuild both knowledge graphs and are activated automatically by `make setup` or `pnpm install`.

---

## Contributing

Contributions are welcome! See the [Contributing Guide](https://shiv-source.github.io/gitbuddy-bot/docs/contributing) for setup instructions, coding conventions, and how to add a new domain handler.

1. Fork the repo
2. Clone and run `make setup` (one-command onboarding)
3. Create a feature branch (`git checkout -b feat/my-feature`)
4. Make your changes
5. Run `make test && make lint`
6. Open a PR

The pre-commit hook auto-rebuilds the knowledge graph on every commit — no manual step needed.

New domain handlers follow a consistent pattern — implement `IEventHandler`, extend `BaseHandler`, and register in the composition root at `app/src/index.ts`.

---

## License

MIT © [shiv-source](https://github.com/shiv-source)
