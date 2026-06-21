# Middleware Pipeline

> 23 nodes · cohesion 0.13

## Key Concepts

- **app.ts** (13 connections) — `src/app.ts`
- **context-enricher.ts** (8 connections) — `src/middleware/context-enricher.ts`
- **WatchdogProApp** (8 connections) — `src/app.ts`
- **ContextEnricher** (7 connections) — `src/middleware/context-enricher.ts`
- **ErrorHandler** (6 connections) — `src/middleware/error-handler.ts`
- **RateLimiter** (6 connections) — `src/middleware/rate-limiter.ts`
- **rate-limiter.ts** (5 connections) — `src/middleware/rate-limiter.ts`
- **.enrich()** (4 connections) — `src/middleware/context-enricher.ts`
- **RepoRef** (3 connections) — `src/core/types.ts`
- **.extractRepo()** (3 connections) — `src/middleware/context-enricher.ts`
- **.constructor()** (3 connections) — `src/app.ts`
- **.constructor()** (2 connections) — `src/middleware/context-enricher.ts`
- **.extractOrg()** (2 connections) — `src/middleware/context-enricher.ts`
- **.constructor()** (2 connections) — `src/middleware/error-handler.ts`
- **.handleError()** (2 connections) — `src/middleware/error-handler.ts`
- **.wrap()** (2 connections) — `src/middleware/error-handler.ts`
- **.acquire()** (2 connections) — `src/middleware/rate-limiter.ts`
- **.constructor()** (2 connections) — `src/middleware/rate-limiter.ts`
- **.getOrCreateBucket()** (2 connections) — `src/middleware/rate-limiter.ts`
- **.registerAll()** (2 connections) — `src/app.ts`
- **.start()** (2 connections) — `src/app.ts`
- **ProbotContext** (1 connections) — `src/middleware/context-enricher.ts`
- **RateLimitBucket** (1 connections) — `src/middleware/rate-limiter.ts`

## Relationships

- [[Core Interfaces and Types]] (8 shared connections)
- [[Handler Tests and Base]] (7 shared connections)
- [[Slash Commands]] (5 shared connections)
- [[Configuration and Errors]] (2 shared connections)
- [[GitHub Client Adapter]] (2 shared connections)

## Source Files

- `src/app.ts`
- `src/core/types.ts`
- `src/middleware/context-enricher.ts`
- `src/middleware/error-handler.ts`
- `src/middleware/rate-limiter.ts`

## Audit Trail

- EXTRACTED: 88 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*