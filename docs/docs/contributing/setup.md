---
sidebar_position: 1
---

# Development Setup

Set up your local development environment for GitBuddy Bot.

## Prerequisites

- **Node.js ≥ 24** — required for ESM and modern language features
- **pnpm ≥ 11** — package manager
- **uv** — Python toolchain manager (installed automatically by `make setup`)
- **Git** — for version control
- **A GitHub account** — for creating a test GitHub App
- **Claude Code** (optional) — for AI-assisted development with knowledge graphs

## One-Command Setup (Recommended)

```bash
git clone https://github.com/shiv-source/gitbuddy-bot.git
cd gitbuddy-bot
make setup
```

`make setup` handles everything in one shot:

```
✔ Checks prerequisites (git, node, pnpm — reads versions from package.json)
✔ Installs uv (Python toolchain)
✔ Installs graphify[mcp] (knowledge graph + MCP server)
✔ Installs code-review-graph (code review graph)
✔ Registers MCP servers with Claude Code + verifies connections
✔ Installs pnpm dependencies + activates Husky git hooks
✔ Builds both knowledge graphs
```

For CI environments, use `make setup-ci` (skips MCP registration and interactive prompts).

## Manual Setup (Step by Step)

### 1. Install pnpm

```bash
corepack enable pnpm
# or: npm install -g pnpm@$(node -e "process.stdout.write(require('./package.json').engines.pnpm)")
```

### 2. Clone and Install Dependencies

```bash
git clone https://github.com/shiv-source/gitbuddy-bot.git
cd gitbuddy-bot
make install
```

The `make install` triggers Husky's `prepare` script, which activates git hooks automatically.

### 3. Install Knowledge Graph Tools (Optional)

```bash
# Graphify (knowledge graph):
uv tool install 'graphify[mcp]'
graphify update .

# Code-review-graph:
pipx install code-review-graph
code-review-graph build
```

### 4. Register MCP Servers (Optional — Claude Code only)

```bash
claude mcp add graphify -- graphify-mcp graphify-out/graph.json
claude mcp add code-review-graph -- uvx code-review-graph serve
```

## Verify Setup

Run these commands to verify everything works:

```bash
make typecheck       # TypeScript compiles cleanly
make test            # All tests pass with coverage
make lint            # No lint errors
make mcp-check       # MCP servers connected (optional)
```

If all checks pass, your environment is ready.

## Project Layout

```
gitbuddy-bot/
├── app/                          # Probot GitHub App
│   ├── src/
│   │   ├── index.ts              # Composition root
│   │   ├── app.ts                # Application wiring
│   │   ├── core/                 # Interfaces, types, errors (zero framework deps)
│   │   ├── infrastructure/       # Octokit, YAML config, cache, logger adapters
│   │   ├── handlers/             # 7 domain event handlers
│   │   ├── commands/             # Slash command implementations
│   │   ├── services/             # Pure business logic
│   │   └── middleware/           # Context enricher, rate limiter, error handler
│   └── tests/
│       ├── unit/                 # Unit tests
│       └── integration/          # Integration tests
├── docs/                         # Docusaurus documentation site
├── scripts/                      # Automation and setup scripts
│   ├── setup.sh                  # One-command team onboarding
│   ├── graphify-pre-commit.sh    # Pre-commit: rebuild + stage graph
│   └── graphify-post-checkout.sh # Post-checkout: rebuild on branch switch
├── .husky/                       # Husky-managed git hooks (portable)
│   ├── pre-commit                # → scripts/graphify-pre-commit.sh
│   └── post-checkout             # → scripts/graphify-post-checkout.sh
├── graphify-out/                 # Graphify knowledge graph (tracked in git)
├── .code-review-graph/           # Code-review-graph data
├── .claude/                      # Claude Code project settings
├── Makefile                      # All commands: setup, build, test, lint, docs, graphs
├── package.json                  # Dependencies and scripts
└── tsconfig.json                 # TypeScript configuration
```

## Running Locally

```bash
make dev            # TypeScript watch mode — recompiles on change
make build          # Compile TypeScript → dist/
make start          # Run the compiled app
```

For full GitHub App integration testing, you'll need:
1. A registered GitHub App (see [GitHub App Setup](../self-hosting/github-app-setup.md))
2. A tool like [smee.io](https://smee.io/) to forward webhooks to localhost
3. Environment variables set (`APP_ID`, `PRIVATE_KEY`, `WEBHOOK_SECRET`)

## Development Workflow

1. **Run `make setup`** — one-command onboarding
2. **Create a branch** from `main`
3. **Make changes** and write tests
4. **Run `make typecheck && make test && make lint`** before committing
5. **Commit** — the pre-commit hook auto-rebuilds the knowledge graph
6. **Open a PR** using the [PR template](https://github.com/shiv-source/gitbuddy-bot/blob/main/.github/pull_request_template.md)

## Make Targets Quick Reference

| Target | Purpose |
|--------|---------|
| `make setup` | Full team onboarding |
| `make setup-ci` | CI onboarding |
| `make install` | Install pnpm dependencies |
| `make build` | Compile TypeScript |
| `make dev` | Watch mode |
| `make test` | Run all tests |
| `make lint` | ESLint |
| `make typecheck` | TypeScript check (noEmit) |
| `make graph-update` | Incremental graph rebuild |
| `make graph-rebuild` | Full graph rebuild (both tools) |
| `make mcp-check` | Verify MCP connections |
| `make mcp-register` | Register MCP servers |

## Next Steps

- [Workflow](workflow.md) — branch, commit, and PR conventions
- [Git Hooks](git-hooks.md) — how Husky hooks work and how to customize them
- [Knowledge Graphs](knowledge-graphs.md) — graphify + code-review-graph deep dive
- [Testing](testing.md) — unit vs integration test conventions
- [Code Style](code-style.md) — formatting and naming rules
- [Adding a Handler](adding-a-handler.md) — walkthrough for new handlers
