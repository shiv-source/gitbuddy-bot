---
sidebar_position: 1
---

# Development Setup

Set up your local development environment for GitBuddy Bot.

## Prerequisites

- **Node.js ≥ 24** — required for ESM and modern language features
- **pnpm** — install via `corepack enable` or `npm i -g pnpm`
- **Git** — for version control
- **A GitHub account** — for creating a test GitHub App

## Clone and Install

```bash
git clone https://github.com/shiv-source/gitbuddy-bot.git
cd gitbuddy-bot
pnpm install
```

## Verify Setup

Run these commands to verify everything works:

```bash
pnpm run typecheck   # TypeScript compiles cleanly
pnpm test            # All tests pass with coverage
pnpm run lint        # No lint errors
```

If all three pass, your environment is ready.

## Project Layout

```
gitbuddy-bot/
├── src/
│   ├── index.ts              # Composition root
│   ├── app.ts                # Application wiring
│   ├── core/                 # Interfaces, types, errors
│   ├── infrastructure/       # GitHub, config, cache, logging adapters
│   ├── handlers/             # Domain event handlers
│   ├── commands/             # Slash command implementations
│   ├── services/             # Pure business logic
│   └── middleware/           # Context enricher, rate limiter, error handler
├── tests/
│   ├── unit/                 # Unit tests
│   └── integration/          # Integration tests
├── docs/                     # Docusaurus documentation site
├── CLAUDE.md                 # Architecture reference
├── package.json              # Dependencies and scripts
└── tsconfig.json             # TypeScript configuration
```

## Running Locally

```bash
pnpm run dev        # TypeScript watch mode — recompiles on change
pnpm run build      # Compile TypeScript → dist/
pnpm start          # Run the compiled app
```

For full GitHub App integration testing, you'll need:
1. A registered GitHub App (see [GitHub App Setup](../self-hosting/github-app-setup.md))
2. A tool like [smee.io](https://smee.io/) to forward webhooks to localhost
3. Environment variables set (`APP_ID`, `PRIVATE_KEY`, `WEBHOOK_SECRET`)

## Development Workflow

1. **Create a branch** from `main`
2. **Make changes** and write tests
3. **Run typecheck + tests + lint** before committing
4. **Open a PR** using the [PR template](https://github.com/shiv-source/gitbuddy-bot/blob/main/.github/pull_request_template.md)

## Next Steps

- [Workflow](workflow.md) — branch, commit, and PR conventions
- [Testing](testing.md) — unit vs integration test conventions
- [Code Style](code-style.md) — formatting and naming rules
- [Adding a Handler](adding-a-handler.md) — walkthrough for new handlers
