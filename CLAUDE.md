# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands are run from the repo root via `make`:

```bash
make install          # Install all workspace dependencies
make build            # Compile TypeScript (tsc)
make dev              # Watch mode — recompiles on changes
make start            # Run the app (node dist/index.js)
make test             # All tests with coverage
make test-unit        # Unit tests only
make test-integration # Integration tests only
make test-watch       # Jest watch mode
make lint             # ESLint over src/ and tests/
make typecheck        # tsc --noEmit (no output, just types)
make clean            # Remove dist/ and coverage/

# Docs site
make docs-dev         # Start Docusaurus locally
make docs-build       # Build static docs
make docs-api         # Generate TypeDoc API reference
```

**Running a single test:**

```bash
make test-unit         # then, if you want a single file:
cd app && pnpm exec jest --no-coverage tests/unit/path/to/test.test.ts
```

## Architecture

This is a **pnpm monorepo** with two workspaces: `app/` (the Probot GitHub App) and `docs/` (Docusaurus). Node >= 24, pnpm >= 11, ESM (`"type": "module"`, TS `module: "node16"`).

All commands run through the **Makefile** at the repo root (`make help` to list them). The root `package.json` scripts are thin wrappers — prefer `make`. Tooling files at root: `Makefile`, `.nvmrc` (Node version), `.npmrc` (`engine-strict=true`), `pnpm-workspace.yaml`.

### Dependency Inversion (the backbone)

Every domain concept depends on **interfaces** (`app/src/core/interfaces.ts`), never concrete implementations. The interfaces and types in `app/src/core/` have **zero framework imports** — no Probot, no Octokit. This is the D in SOLID.

The **composition root** (`app/src/index.ts`) is the single file that picks concrete implementations and wires them together. If you need to swap a logger, cache backend, or config source, `index.ts` is the only file that changes.

### Request lifecycle (middleware chain)

```
GitHub webhook → Probot
  → ContextEnricher  — normalizes repo/org/sender from raw payload
    → RateLimiter     — per-event-type concurrency cap (10/min, 60s window)
      → ErrorHandler  — classifies errors via AppError hierarchy, prevents crashes
        → Domain Handler → Service → Adapter → GitHub API
```

Each webhook delivery gets its own `OctokitClient` (per-installation-scoped Octokit from Probot). This is created in `app.ts`, not in the composition root — handlers receive it via `context.octokit`.

### Handlers (Template Method pattern)

All seven domain handlers extend `BaseHandler` (`app/src/handlers/base-handler.ts`), which enforces:

```
validate(context) → enrich(context) → process(context) → respond(context, result)
```

Subclasses override only the steps they need. `process()` is the only abstract method — everything else has a no-op default.

- `governance.handler.ts` — `repository.created`, `branch_protection_rule.*`
- `automation.handler.ts` — `issues.opened`, `pull_request.opened`, `issues.labeled`
- `security.handler.ts` — `secret_scanning_alert.created`, `push`
- `sync.handler.ts` — `workflow_run.completed`, `deployment_status`
- `insights.handler.ts` — `check_run.completed`, `pull_request.closed`
- `copilot.handler.ts` — `pull_request.opened`, `issue_comment.created`
- `stale.handler.ts` — `workflow_run.completed`

### Services (pure business logic)

Services live in `app/src/services/` and depend only on core interfaces (`IGitHubClient`, `IConfigProvider`, `ILogger`). They are stateless — no framework, no Probot. `StaleService` is the primary example: two-phase sweep (mark → close) operating on pure inputs.

### Infrastructure adapters

All in `app/src/infrastructure/`, each implementing a core interface via the Adapter pattern:

- `OctokitClient` — wraps Probot's Octokit, implements `IGitHubClient`, handles retry with exponential backoff and rate-limit detection
- `YamlConfigProvider` — reads `.github/gitbuddy.yml` (with `.yaml` and `gitbuddy.yml` fallbacks), implements `IConfigProvider`
- `MemoryCache` — in-memory TTL cache, implements `ICache`
- `ProbotLogger` — adapts Probot's pino logger to `ILogger`

### Slash commands (Command pattern)

Commands in `app/src/commands/` implement `ICommand` and are registered into `CommandRouter` in `index.ts`. Each command receives a `CommandContext` with the per-event `IGitHubClient`. Adding a command means: one new file + one `commandRouter.register(...)` line.

### Error hierarchy

`app/src/core/errors.ts` — `AppError` is the base class with `code`, `statusCode`, and `recoverable` fields. Subclasses: `ConfigError`, `RateLimitError`, `ValidationError`, `GitHubApiError`, `NotFoundError`, `HandlerError`. The `ErrorHandler` middleware classifies errors by type and decides whether to log, skip, or report.

## Conventions

- **`.js` extensions in TS imports** — the project uses `moduleResolution: "node16"` with ESM, so all relative imports use `.js` extension: `import { BaseHandler } from './base-handler.js'`
- **No `index.ts` barrel files for `core/`** — the Jest config excludes them from coverage and they aren't used as re-export hubs. Import directly from the specific file.
- **`EventContext` carries `octokit`** — handlers do not receive `IGitHubClient` via constructor. It's per-event via `context.octokit` because each webhook delivery has its own installation-scoped client.
- **TS strict mode** — `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch` are all enabled.
- **Config is per-repo, with defaults** — every config key has a default in `YamlConfigProvider`. Handlers call `this.config.get('path', defaultValue)`.
- **Handlers must not throw** — return `HandlerResult` on success, `NO_ACTION` for no-ops. The `ErrorHandler` middleware catches any thrown `AppError`.
