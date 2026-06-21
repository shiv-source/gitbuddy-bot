# Installation

Self-host GitBuddy Bot on your own infrastructure.

## Prerequisites

- **Node.js ≥ 24** — required for ESM and modern language features
- **pnpm** — package manager (`corepack enable` or `npm i -g pnpm`)
- **A GitHub App** — registered in your org or personal account
- **A hosting platform** — Railway, Fly.io, Render, or any VPS

## One-Command Setup (Recommended)

```bash
git clone https://github.com/shiv-source/gitbuddy-bot.git
cd gitbuddy-bot
make setup
```

`make setup` handles everything: installs `uv`, `graphify[mcp]`, `code-review-graph`, registers MCP servers, installs pnpm dependencies, activates Husky git hooks, and builds both knowledge graphs.

For CI environments:

```bash
make setup-ci
```

## Manual Setup

### Clone and Install

```bash
git clone https://github.com/shiv-source/gitbuddy-bot.git
cd gitbuddy-bot
pnpm install
```

### Verify Setup

```bash
pnpm run typecheck   # TypeScript compiles
pnpm test            # All tests pass
pnpm run lint        # No lint errors
```

### Build and Run

```bash
pnpm run build       # Compile TypeScript → dist/
pnpm start           # Start the bot (node dist/index.js)
```

For development with hot reload:

```bash
pnpm run dev         # Watch mode — recompiles on change
```

## Next Steps

- [GitHub App Setup](self-hosting/github-app-setup.md) — create and configure the GitHub App
- [Deployment](self-hosting/deployment.md) — deploy to Railway, Fly.io, Render, or VPS
- [Environment Variables](self-hosting/environment-variables.md) — all required and optional env vars
- [Monitoring](self-hosting/monitoring.md) — health check, logging, alerts
