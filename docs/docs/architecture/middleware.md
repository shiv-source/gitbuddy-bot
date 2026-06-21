# Middleware

GitBuddy Bot uses a **Chain of Responsibility** middleware pipeline that processes every incoming webhook event before it reaches the domain handlers.

## Pipeline

```
Webhook Event
  │
  ▼
Context Enricher ──► Rate Limiter ──► Error Handler ──► Domain Handler
```

## Context Enricher

**File:** `src/middleware/context-enricher.ts`

Extracts normalized data from the raw Probot/GitHub webhook payload:

- **`repo`** — `{owner, repo}` (normalized repo reference)
- **`org`** — Organization name derived from the repo
- **`sender`** — GitHub username who triggered the event
- **`eventType`** — Normalized event name

This enrichment saves every handler from parsing the raw payload independently.

## Rate Limiter

**File:** `src/middleware/rate-limiter.ts`

Per-event-type concurrency cap. Prevents any single event type from overwhelming the bot.

- Configurable concurrency per event type
- Queues excess events with a configurable timeout
- Returns `429`-style backpressure when the queue is full

## Error Handler

**File:** `src/middleware/error-handler.ts`

Classifies errors using the `AppError` hierarchy from `src/core/errors.ts`:

```typescript
// Error hierarchy
AppError
  ├── ConfigError
  │   └── ConfigNotFoundError
  ├── ValidationError
  ├── RateLimitError
  ├── GitHubApiError
  │   └── NotFoundError
  └── HandlerError
```

Based on error type, the error handler:
- Logs the error with appropriate severity
- Posts a comment on the issue/PR for user-facing errors (config, validation)
- Retries on transient errors (rate limits, network)
- Silently swallows non-critical errors with proper logging

## Middleware Registration

Middleware is wired in `src/app.ts`:

```typescript
const pipeline = new ContextEnricher()
  .setNext(new RateLimiter())
  .setNext(new ErrorHandler());

// Each handler is wrapped
for (const handler of handlers) {
  app.on(handler.events, (context) =>
    pipeline.handle(context, handler)
  );
}
```
