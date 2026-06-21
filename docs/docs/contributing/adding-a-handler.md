# Adding a Domain Handler

Walkthrough: create a new event handler for GitBuddy Bot.

## Overview

Handlers are the core of GitBuddy Bot. Each one handles a specific domain of GitHub events. This guide walks through adding a hypothetical "Notifications" handler that sends alerts when certain events occur.

## Step 1: Create the Handler File

Create `src/handlers/notifications.handler.ts`:

```typescript
import { BaseHandler } from './base-handler.js';
import type { ILogger, IConfigProvider } from '../core/interfaces.js';
import type { EventContext, HandlerResult } from '../core/types.js';
import { NO_ACTION } from '../core/types.js';

export class NotificationsHandler extends BaseHandler {
  name = 'notifications';
  events = ['issues.opened', 'pull_request.opened'];

  constructor(
    private readonly logger: ILogger,
    private readonly config: IConfigProvider,
  ) {
    super();
  }

  protected async validate(context: EventContext): Promise<void> {
    // Only process if notifications are configured
    const enabled = this.config.get('notifications.enabled', false);
    if (!enabled) {
      throw new Error('SKIP'); // BaseHandler catches and returns NO_ACTION
    }
  }

  protected async process(context: EventContext): Promise<HandlerResult> {
    const channels = this.config.get('notifications.channels', []);
    const eventType = context.payload.action === 'opened' ? 'new' : 'updated';

    for (const channel of channels) {
      await this.notifyChannel(channel, context, eventType);
      this.logger.info(`Notification sent to ${channel}`, {
        repo: context.repo,
        event: context.event,
      });
    }

    return {
      success: true,
      data: { channelsNotified: channels.length },
    };
  }

  private async notifyChannel(
    channel: string,
    context: EventContext,
    eventType: string,
  ): Promise<void> {
    // Use context.octokit for GitHub API calls
    // Use this.config for configuration
  }
}
```

## Step 2: Register in the Composition Root

In `src/index.ts`, import and register your handler:

```typescript
import { NotificationsHandler } from './handlers/notifications.handler.js';

// ...

const handlers = [
  new GovernanceHandler(logger, config),
  new AutomationHandler(logger, config),
  new SecurityHandler(logger, config),
  new StaleHandler(logger, config, cache),
  new InsightsHandler(logger, config),
  new SyncHandler(logger, config),
  new CopilotHandler(logger, config),
  new NotificationsHandler(logger, config),  // ← Add here
];
```

## Step 3: Add Config Type (if needed)

If your handler introduces new config, add it to `src/core/types.ts`:

```typescript
export interface GitBuddyConfig {
  governance?: GovernanceConfig;
  automation?: AutomationConfig;
  security?: SecurityConfig;
  // ...
  notifications?: NotificationsConfig;  // ← Add here
}

export interface NotificationsConfig {
  enabled: boolean;
  channels: string[];
}
```

## Step 4: Add Tests

Create `tests/unit/handlers/notifications.handler.test.ts`:

```typescript
import { NotificationsHandler } from '../../../src/handlers/notifications.handler.js';

describe('NotificationsHandler', () => {
  const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };
  const mockConfig = { get: jest.fn() };
  const mockOctokit = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should skip when notifications are disabled', async () => {
    mockConfig.get.mockReturnValue(false);
    const handler = new NotificationsHandler(mockLogger as any, mockConfig as any);

    // Validation should throw SKIP
    await expect(
      handler.handle({
        octokit: mockOctokit as any,
        event: 'issues.opened',
        payload: { action: 'opened' },
        repo: { owner: 'test', repo: 'test-repo' },
        org: 'test',
        sender: 'test-user',
        config: {},
      })
    ).rejects.toThrow();
  });

  it('should notify configured channels', async () => {
    mockConfig.get.mockImplementation((key: string) => {
      if (key === 'notifications.enabled') return true;
      if (key === 'notifications.channels') return ['slack', 'email'];
      return undefined;
    });

    const handler = new NotificationsHandler(mockLogger as any, mockConfig as any);

    const result = await handler.process({
      // ... context ...
    } as any);

    expect(result.success).toBe(true);
    expect(mockLogger.info).toHaveBeenCalledTimes(2);
  });
});
```

## Step 5: Add Config to Documentation

Add your config section to `docs/docs/configuration/` and update the sidebar if needed.

## Checklist

- [ ] Handler extends `BaseHandler`
- [ ] Handler depends on `ILogger`, `IConfigProvider` (interfaces, not implementations)
- [ ] Uses `context.octokit` for GitHub API calls (never imports Octokit directly)
- [ ] Config accessed via `this.config.get()` with dot notation and defaults
- [ ] Returns `HandlerResult` or `NO_ACTION`
- [ ] Registered in `src/index.ts`
- [ ] Tests cover the `process()` method
- [ ] TypeScript compiles cleanly: `pnpm run typecheck`
- [ ] Tests pass: `pnpm test`
- [ ] Linter passes: `pnpm run lint`
