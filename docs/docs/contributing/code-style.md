# Code Style

Formatting, naming, and design conventions for GitBuddy Bot.

## TypeScript

- Strict mode enabled in `tsconfig.json`
- ESM imports only (`import` / `export`, no `require`)
- Prefer `interface` over `type` for object shapes
- Use `type` for unions, intersections, and mapped types

## Formatting

- ESLint enforces consistent style: `pnpm run lint`
- Indentation: 2 spaces
- Quotes: single (`'`) for strings, template literals for interpolation
- Semicolons: required
- Trailing commas: always in multiline

## Naming

| Entity | Convention | Example |
|--------|-----------|---------|
| Files | kebab-case | `automation.handler.ts` |
| Classes | PascalCase | `AutomationHandler` |
| Interfaces | `I` prefix | `IGitHubClient`, `IConfigProvider` |
| Types | PascalCase, no prefix | `EventContext`, `RepoRef` |
| Methods/Functions | camelCase | `addLabels()`, `getBranchProtection()` |
| Constants | UPPER_SNAKE_CASE | `NO_ACTION` |
| Directories | kebab-case or flat | `core/`, `infrastructure/` |

## Imports

Use `.js` extensions even in TypeScript (ESM requirement):

```typescript
// Correct
import { BaseHandler } from './base-handler.js';
import type { EventContext } from '../core/types.js';

// Wrong
import { BaseHandler } from './base-handler';
```

Order imports:
1. External packages
2. Core interfaces/types
3. Internal modules
4. Type-only imports (use `import type`)

## Error Handling

Use the `AppError` hierarchy from `src/core/errors.ts`:

```typescript
// Throwing
throw new ConfigNotFoundError('governance', 'org/repo');
throw new ValidationError('Invalid status check name');
throw new RateLimitError('GitHub API', retryAfter);

// Catching
try {
  await client.addLabels(...);
} catch (error) {
  if (error instanceof NotFoundError) {
    // Issue doesn't exist — ignore
    return NO_ACTION;
  }
  throw error; // Re-throw for error handler middleware
}
```

## Dependency Injection

- Handlers depend on interfaces (`ILogger`, `IConfigProvider`), **never** on concrete implementations
- `IGitHubClient` arrives via `EventContext.octokit` — never import Octokit directly
- Config access: `this.config.get('automation.staleAfterDays', 60)` — always with a default

## Handler Pattern

Every handler follows this structure:

```typescript
export class MyHandler extends BaseHandler {
  name = 'my-handler';
  events = ['issues.opened'];

  constructor(
    private readonly logger: ILogger,
    private readonly config: IConfigProvider,
  ) {
    super();
  }

  protected async validate(context: EventContext): Promise<void> {
    // Optional: early validation
  }

  protected async enrich(context: EventContext): Promise<EventContext> {
    // Optional: add computed fields
    return context;
  }

  protected async process(context: EventContext): Promise<HandlerResult | typeof NO_ACTION> {
    // Required: core business logic
    return { success: true };
  }

  protected async respond(result: HandlerResult): Promise<HandlerResult> {
    // Optional: post comments, update labels
    return result;
  }
}
```

## GitBuddy-Specific Rules

1. **No direct Octokit usage** outside `src/infrastructure/github/`
2. **Config via `IConfigProvider.get()`** with dot notation and defaults
3. **Per-event client**: use `context.octokit`, never store a client reference
4. **Return `NO_ACTION`** when a handler decides not to process an event
5. **New handlers registered in `src/index.ts`** — the composition root
