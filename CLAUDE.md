# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Watchdog Pro** — a monolithic Probot GitHub App for org-wide governance, PR/issue automation, security scanning, cross-repo orchestration, DORA insights, and AI copilot integration. Node.js ESM, TypeScript, requires Node ≥24.

## Commands

```bash
pnpm install              # Install dependencies
pnpm run typecheck        # TypeScript check (tsc --noEmit)
pnpm run build            # Compile TypeScript → dist/
pnpm test                 # All tests with coverage (jest --coverage)
pnpm run test:unit        # Unit tests only (tests/unit/)
pnpm run test:integration # Integration tests only (tests/integration/)
pnpm run lint             # ESLint on src/ and tests/
pnpm start                # Run compiled app (node dist/index.js)
pnpm run dev              # Watch mode (tsc --watch)
pnpm run clean            # Remove dist/ and coverage/
```

Tests use Jest with `ts-jest` in ESM mode (`--experimental-vm-modules`). Coverage thresholds: branches 30%, functions 40%, lines 50%, statements 45%.

`test:unit` and `test:integration` run specific subdirectories — place new tests accordingly. The `tsconfig.test.json` extends the base config and includes `tests/**/*`.

## Architecture

The codebase follows **Domain-Driven Design with SOLID layers**:

```
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

**Composition root (`src/index.ts`):** All concrete implementations are instantiated and wired here. Handlers and services depend only on interfaces (`ILogger`, `IConfigProvider`, `IGitHubClient`). To swap an adapter, change only this file.

**Template Method (`src/handlers/base-handler.ts`):** Every domain handler extends `BaseHandler`, which defines the pipeline: `validate → enrich → process → respond`. Subclasses override only the steps they need. `process()` is the only abstract method.

**Per-event client:** `IGitHubClient` is NOT a constructor dependency — it's created fresh per webhook delivery from Probot's installation-scoped Octokit and injected via `EventContext.octokit`. Handlers never construct their own GitHub client.

**Middleware chain:** Each event flows through `ContextEnricher` (extracts normalized repo/org/sender from raw payload) → `RateLimiter` (per-event-type concurrency cap) → handler wrapped by `ErrorHandler` (classifies errors via `AppError` hierarchy, optionally posts to issue).

**Adapter pattern:** `OctokitClient` implements `IGitHubClient` with domain-named methods (`addLabels`, `requestReviewers`, `getBranchProtection`, etc.). Services never import Octokit directly. Retry with exponential backoff and rate-limit detection are built in.

### Interfaces and types

- `src/core/interfaces.ts` — `IEventHandler`, `ILogger`, `IGitHubClient`, `IConfigProvider`, `ICache`, `ICommand`
- `src/core/types.ts` — `EventContext`, `RepoRef`, `HandlerResult`, `NO_ACTION`, `WatchdogConfig` (all sub-configs defined here), `BranchProtection`, `TeamMember`
- `src/core/errors.ts` — `AppError` hierarchy: `ConfigError`, `ConfigNotFoundError`, `RateLimitError`, `ValidationError`, `GitHubApiError`, `NotFoundError`, `HandlerError`

### Adding a new domain handler

1. Create file in `src/handlers/` extending `BaseHandler`
2. Set `name` and `events` (array of Probot event names)
3. Implement `process(context)` — returns `HandlerResult` or `NO_ACTION`
4. Register in `src/index.ts` with `new MyHandler(logger, config)`
5. Add to the `handlers` array

### Adding a new slash command

1. Create file in `src/commands/` implementing `ICommand`
2. Register in `src/index.ts`: `commandRouter.register(new MyCommand())`

## Configuration

The app reads `.github/watchdog.yml` from repos. Config paths fall back: repo-level → org `.github` repo → defaults. Use dot notation to access nested values via `IConfigProvider.get('automation.staleAfterDays', 60)`.

## Stale issue sweeps

Triggered by `workflow_run.completed` events when the workflow name contains "stale-sweep" or "mark stale" (case-insensitive). From the `.github` repo: sweeps the entire org. From any other repo: sweeps only that repo. The two-phase sweep (mark stale → close) is implemented in `src/services/stale.service.ts`.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
