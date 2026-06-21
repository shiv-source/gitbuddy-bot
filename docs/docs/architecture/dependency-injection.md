# Dependency Injection

GitBuddy Bot uses the **Composition Root** pattern for dependency injection, without a DI framework.

## Composition Root

**File:** `src/index.ts`

This is the **only place** where concrete implementations are instantiated and wired together. Everything else depends on abstractions (interfaces).

```typescript
// src/index.ts — Composition Root
import { ProbotLogger } from './infrastructure/logging/probot-logger.js';
import { YamlConfigProvider } from './infrastructure/config/yaml-config.js';
import { MemoryCache } from './infrastructure/cache/memory-cache.js';
import { OctokitClient } from './infrastructure/github/octokit-client.js';

// 1. Create concrete implementations
const logger = new ProbotLogger();
const config = new YamlConfigProvider(logger);
const cache = new MemoryCache();

// 2. Inject into handlers (via constructor)
const handlers = [
  new GovernanceHandler(logger, config),
  new AutomationHandler(logger, config),
  new SecurityHandler(logger, config),
  new StaleHandler(logger, config, cache),
  new InsightsHandler(logger, config),
  new SyncHandler(logger, config),
  new CopilotHandler(logger, config),
];

// 3. Inject into commands
const commandRouter = new CommandRouter();
commandRouter.register(new ShipitCommand());
commandRouter.register(new LabelCommand());
commandRouter.register(new TriageCommand());

// 4. Wire into the application
const app = new Application(logger, handlers, commandRouter);
```

## Why No DI Framework

The composition root pattern is chosen over a DI framework for:

- **Zero runtime overhead** — no decorators, no reflect-metadata
- **Explicit wiring** — you can trace every dependency from one file
- **TypeScript-native** — no framework-specific annotations or patterns
- **Simple testing** — pass mock implementations directly to constructors

## Constructor Injection

Handlers and services receive their dependencies via constructor injection:

```typescript
// Handler depends on interfaces, not implementations
class AutomationHandler extends BaseHandler {
  constructor(
    private readonly logger: ILogger,        // ← Interface
    private readonly config: IConfigProvider, // ← Interface
  ) {
    super();
  }
}
```

## Per-Event Client

`IGitHubClient` is NOT a constructor dependency — it's created fresh per webhook delivery from Probot's installation-scoped Octokit and injected via `EventContext.octokit`. This ensures:

- Correct installation token per event
- Proper repo-level permissions
- No stale token issues

```typescript
// Inside a handler's process() method
async process(context: EventContext): Promise<HandlerResult> {
  // context.octokit is scoped to the installation that sent this event
  await context.octokit.addLabels({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: issueNumber,
    labels: ['triage'],
  });
}
```

## Swapping Implementations

To replace an adapter (e.g., Redis instead of memory cache, JSON config instead of YAML), change **only the composition root**:

```typescript
// Before
const cache = new MemoryCache();

// After — only this line changes
const cache = new RedisCache(redisConnectionString);
```

No other file in the codebase needs to change.
