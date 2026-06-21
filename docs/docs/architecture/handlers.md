# Handlers

Domain handlers are the heart of GitBuddy Bot. Each handler processes a specific domain of GitHub events.

## BaseHandler — Template Method

All handlers extend `BaseHandler` (`src/handlers/base-handler.ts`), which defines a Template Method pipeline:

```
validate(context) → enrich(context) → process(context) → respond(result)
```

Subclasses override only the steps they need. `process()` is the only abstract method.

```typescript
export abstract class BaseHandler implements IEventHandler {
  abstract name: string;
  abstract events: string[];

  // Template method — subclasses override steps as needed
  async handle(context: EventContext): Promise<HandlerResult | typeof NO_ACTION> {
    await this.validate(context);
    const enriched = await this.enrich(context);
    const result = await this.process(enriched);
    return this.respond(result);
  }

  // Default implementations — override in subclass
  protected async validate(context: EventContext): Promise<void> {
    // Check event type, repo access, etc.
  }

  protected async enrich(context: EventContext): Promise<EventContext> {
    // Add computed fields, fetch additional data
    return context;
  }

  protected abstract process(context: EventContext): Promise<HandlerResult | typeof NO_ACTION>;

  protected async respond(result: HandlerResult): Promise<HandlerResult> {
    // Post comments, update labels, etc.
    return result;
  }
}
```

## The 7 Domain Handlers

### Governance Handler

- **File:** `src/handlers/governance.handler.ts`
- **Events:** `repository.created`, `branch_protection_rule.*`
- **Responsibility:** Auto-bootstrap repos with required files, enforce branch protection, MFA checks

### Automation Handler

- **File:** `src/handlers/automation.handler.ts`
- **Events:** `issues.opened`, `pull_request.opened`
- **Responsibility:** Auto-label issues, enforce PR checklists, manage merge queue

### Security Handler

- **File:** `src/handlers/security.handler.ts`
- **Events:** `push`, `issues.opened`
- **Responsibility:** Secret scanning in commits/issues, PAT age reminders, collaborator alerts

### Stale Handler

- **File:** `src/handlers/stale.handler.ts`
- **Events:** `workflow_run.completed`
- **Responsibility:** Two-phase stale sweep: mark stale issues, close expired stale issues

### Sync Handler

- **File:** `src/handlers/sync.handler.ts`
- **Events:** `push`
- **Responsibility:** Propagate config/source changes to configured downstream repos

### Insights Handler

- **File:** `src/handlers/insights.handler.ts`
- **Events:** `check_run.*`, `deployment_status`
- **Responsibility:** Collect DORA metrics, detect CI flakiness, generate weekly digests

### Copilot Handler

- **File:** `src/handlers/copilot.handler.ts`
- **Events:** `pull_request.opened`, `issue_comment.created`
- **Responsibility:** AI PR review, description generation, label suggestion

## Adding a New Handler

1. Create `src/handlers/my-handler.ts`:

```typescript
import { BaseHandler } from './base-handler.js';
import type { EventContext, HandlerResult } from '../core/types.js';

export class MyHandler extends BaseHandler {
  name = 'my-handler';
  events = ['issues.opened'];

  protected async process(context: EventContext): Promise<HandlerResult> {
    // Your logic here
    return { success: true };
  }
}
```

2. Register in `src/index.ts`:

```typescript
handlers.push(new MyHandler(logger, config));
```

## Handler Contract

Every handler receives an `EventContext`:

```typescript
interface EventContext {
  octokit: IGitHubClient;       // Per-event, installation-scoped
  payload: ProbotPayload;       // Raw webhook payload
  repo: RepoRef;                // Normalized {owner, repo}
  org: string;                  // Organization name
  sender: string;               // Username who triggered the event
  config: GitBuddyConfig;       // Resolved config for this repo
}
```

And returns either `HandlerResult` or `NO_ACTION`:

```typescript
interface HandlerResult {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
}

const NO_ACTION = Symbol('no_action');
```

Return `NO_ACTION` when the handler decides the event doesn't need processing (e.g., config not enabled for this domain).
