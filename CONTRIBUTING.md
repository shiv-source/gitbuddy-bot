# Contributing to GitBuddy Bot

Thanks for your interest in contributing! GitBuddy Bot is a monolithic Probot GitHub App for org-wide governance, PR/issue automation, security scanning, cross-repo orchestration, DORA insights, and AI copilot integration.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- **Node.js ≥ 24** — the project uses modern ESM and language features
- **pnpm** — package manager (install via `corepack enable` or `npm i -g pnpm`)
- **A GitHub App** (for local testing) — see [GitHub App Setup](docs/self-hosting/github-app-setup.md)

### Dev Environment

```bash
git clone https://github.com/shiv-source/gitbuddy-bot.git
cd gitbuddy-bot
pnpm install
pnpm run typecheck
pnpm test
```

### Running Locally

```bash
pnpm run dev        # TypeScript watch mode
pnpm run build      # Compile TypeScript → dist/
pnpm start          # Run compiled app
```

## Development Workflow

### Branching

- Create branches from `main`
- Use descriptive branch names: `feature/description`, `fix/description`, `docs/description`
- Keep branches focused — one concern per PR

### Commit Messages

Write clear, descriptive commit messages. Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
feat: add /merge slash command
fix: handle rate limit in stale sweep
docs: add configuration reference
```

### Before Submitting a PR

1. **TypeScript compiles cleanly:** `pnpm run typecheck`
2. **Tests pass:** `pnpm test`
3. **Linter passes:** `pnpm run lint`
4. **New code follows existing patterns** — see [Architecture](CLAUDE.md#architecture) and the [Adding a Handler](docs/contributing/adding-a-handler.md) guide

### Pull Request Template

Please use the [PR template](.github/pull_request_template.md) when opening a pull request. It covers:
- Type of change
- Affected domains
- Architecture checklist

## Architecture

The codebase follows **Domain-Driven Design with SOLID layers**. Key principles:

| Pattern | Where |
|---|---|
| Template Method | `src/handlers/base-handler.ts` |
| Command | `src/commands/*.ts` |
| Adapter | `src/infrastructure/github/octokit-client.ts` |
| Chain of Responsibility | `src/middleware/*` |
| Composition Root / DI | `src/index.ts` |

All dependencies flow through interfaces defined in `src/core/interfaces.ts`. Handlers and services never import framework code directly.

See [CLAUDE.md](CLAUDE.md) for the full architecture reference and design patterns.

## Testing

- **Unit tests** (`tests/unit/`) — test individual handlers, services, commands in isolation
- **Integration tests** (`tests/integration/`) — test handler pipelines with mocked GitHub API

```bash
pnpm run test:unit         # Unit tests only
pnpm run test:integration  # Integration tests only
pnpm test                  # All tests with coverage
```

Coverage thresholds: branches 30%, functions 40%, lines 50%, statements 45%.

## Adding a New Handler

1. Create file in `src/handlers/` extending `BaseHandler`
2. Set `name` and `events` (array of Probot event names)
3. Implement `process(context)` — returns `HandlerResult` or `NO_ACTION`
4. Register in `src/index.ts`: `new MyHandler(logger, config)`
5. Add to the `handlers` array

See the [adding-a-handler guide](docs/contributing/adding-a-handler.md) for a detailed walkthrough.

## Adding a New Slash Command

1. Create file in `src/commands/` implementing `ICommand`
2. Register in `src/index.ts`: `commandRouter.register(new MyCommand())`

## Questions?

Open a [discussion](https://github.com/shiv-source/gitbuddy-bot/discussions) or ask in an issue.
