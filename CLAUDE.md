# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**GitBuddy Bot** — a monolithic Probot GitHub App for org-wide governance, PR/issue automation, security scanning, cross-repo orchestration, DORA insights, and AI copilot integration. Node.js ESM, TypeScript, requires Node ≥24.

**PR template:** `.github/pull_request_template.md` — use this when opening pull requests. It covers type of change, affected domains, and a checklist aligned with the architecture patterns below.

## Commands

```bash
# Run from repo root — pnpm delegates to the right package via --filter
pnpm install              # Install all workspace dependencies (single lockfile)
pnpm run typecheck        # TypeScript check — app (tsc --noEmit)
pnpm run build            # Compile TypeScript — app → app/dist/
pnpm test                 # All tests with coverage (jest --coverage)
pnpm run test:unit        # Unit tests only (app/tests/unit/)
pnpm run test:integration # Integration tests only (app/tests/integration/)
pnpm run lint             # ESLint on app/src/ and app/tests/
pnpm start                # Run compiled app (node app/dist/index.js)
pnpm run dev              # Watch mode (tsc --watch)
pnpm run clean            # Remove app/dist/ and app/coverage/
pnpm run docs:dev         # Start Docusaurus dev server
pnpm run docs:build       # Build Docusaurus site
pnpm run docs:deploy      # Deploy Docusaurus to GitHub Pages
```

Tests use Jest with `ts-jest` in ESM mode (`--experimental-vm-modules`). Coverage thresholds: branches 30%, functions 40%, lines 50%, statements 45%.

`test:unit` and `test:integration` run specific subdirectories — place new tests accordingly. The `tsconfig.test.json` extends the base config and includes `tests/**/*`.

## Architecture

The codebase follows **Domain-Driven Design with SOLID layers**:

```
app/
  src/
    index.ts           # Composition root — ONLY place concrete impls are chosen/wired
    app.ts             # Application class — wires handlers to Probot events
    core/              # Abstractions: interfaces, types, errors (zero framework deps)
    infrastructure/    # Concrete adapters: Probot, Octokit, YAML config, memory cache
    handlers/          # 7 domain handlers (one per domain — governance, automation, etc.)
    commands/          # Slash command implementations (/shipit, /label, /triage)
    services/          # Pure business logic — no framework deps (StaleService, etc.)
    middleware/         # Chain of Responsibility: context-enricher → rate-limiter → error-handler
```

### Key design patterns

**Composition root (`app/src/index.ts`):** All concrete implementations are instantiated and wired here. Handlers and services depend only on interfaces (`ILogger`, `IConfigProvider`, `IGitHubClient`). To swap an adapter, change only this file.

**Template Method (`app/src/handlers/base-handler.ts`):** Every domain handler extends `BaseHandler`, which defines the pipeline: `validate → enrich → process → respond`. Subclasses override only the steps they need. `process()` is the only abstract method.

**Per-event client:** `IGitHubClient` is NOT a constructor dependency — it's created fresh per webhook delivery from Probot's installation-scoped Octokit and injected via `EventContext.octokit`. Handlers never construct their own GitHub client.

**Middleware chain:** Each event flows through `ContextEnricher` (extracts normalized repo/org/sender from raw payload) → `RateLimiter` (per-event-type concurrency cap) → handler wrapped by `ErrorHandler` (classifies errors via `AppError` hierarchy, optionally posts to issue).

**Adapter pattern:** `OctokitClient` implements `IGitHubClient` with domain-named methods (`addLabels`, `requestReviewers`, `getBranchProtection`, etc.). Services never import Octokit directly. Retry with exponential backoff and rate-limit detection are built in.

### Interfaces and types

- `app/src/core/interfaces.ts` — `IEventHandler`, `ILogger`, `IGitHubClient`, `IConfigProvider`, `ICache`, `ICommand`
- `app/src/core/types.ts` — `EventContext`, `RepoRef`, `HandlerResult`, `NO_ACTION`, `GitBuddyConfig` (all sub-configs defined here), `BranchProtection`, `TeamMember`
- `app/src/core/errors.ts` — `AppError` hierarchy: `ConfigError`, `ConfigNotFoundError`, `RateLimitError`, `ValidationError`, `GitHubApiError`, `NotFoundError`, `HandlerError`

### Adding a new domain handler

1. Create file in `app/src/handlers/` extending `BaseHandler`
2. Set `name` and `events` (array of Probot event names)
3. Implement `process(context)` — returns `HandlerResult` or `NO_ACTION`
4. Register in `app/src/index.ts` with `new MyHandler(logger, config)`
5. Add to the `handlers` array

### Adding a new slash command

1. Create file in `app/src/commands/` implementing `ICommand`
2. Register in `app/src/index.ts`: `commandRouter.register(new MyCommand())`

## Configuration

The app reads `.github/gitbuddy.yml` from repos. Config paths fall back: repo-level → org `.github` repo → defaults. Use dot notation to access nested values via `IConfigProvider.get('automation.staleAfterDays', 60)`.

## Stale issue sweeps

Triggered by `workflow_run.completed` events when the workflow name contains "stale-sweep" or "mark stale" (case-insensitive). From the `.github` repo: sweeps the entire org. From any other repo: sweeps only that repo. The two-phase sweep (mark stale → close) is implemented in `app/src/services/stale.service.ts`.
