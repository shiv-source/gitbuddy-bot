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

### Project tree

```
gitbuddy-bot/
├── app/
│   ├── src/
│   │   ├── core/                 # Interfaces, types, error hierarchy (zero framework deps)
│   │   ├── handlers/             # 7 domain handlers extending BaseHandler
│   │   ├── commands/             # Slash commands + CommandRouter
│   │   ├── services/             # Pure business logic (stateless, no framework deps)
│   │   ├── middleware/           # Context enricher, rate limiter, error handler
│   │   └── infrastructure/       # Octokit, YAML config, memory cache, logger adapters
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── handlers/
│   │   │   └── services/
│   │   └── integration/
│   ├── app.yml                   # GitHub App manifest (permissions, events)
│   ├── tsconfig.json
│   ├── jest.config.cjs
│   └── package.json
├── docs/                         # Docusaurus documentation site
│   ├── docs/
│   │   ├── api/
│   │   ├── architecture/
│   │   ├── commands/
│   │   ├── configuration/
│   │   ├── contributing/
│   │   └── self-hosting/
│   ├── docusaurus.config.ts
│   └── package.json
├── .github/                      # CI workflows, PR template, CODEOWNERS
├── .nvmrc                        # Pinned Node version
├── .npmrc                        # engine-strict=true
├── Makefile                      # All commands: build, test, lint, docs
├── pnpm-workspace.yaml
└── package.json                  # Root workspace scripts + engines
```

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

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
| ------ | ---------- |
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.
# test
