# Handler Tests and Base

> 35 nodes · cohesion 0.10

## Key Concepts

- **ILogger** (21 connections) — `src/core/interfaces.ts`
- **IConfigProvider** (14 connections) — `src/core/interfaces.ts`
- **IGitHubClient** (14 connections) — `src/core/interfaces.ts`
- **automation.handler.test.ts** (13 connections) — `tests/unit/handlers/automation.handler.test.ts`
- **stale.handler.test.ts** (12 connections) — `tests/unit/handlers/stale.handler.test.ts`
- **stale.service.test.ts** (12 connections) — `tests/unit/services/stale.service.test.ts`
- **governance.handler.test.ts** (11 connections) — `tests/unit/handlers/governance.handler.test.ts`
- **StaleService** (9 connections) — `src/services/stale.service.ts`
- **stale.service.ts** (8 connections) — `src/services/stale.service.ts`
- **.sweepRepo()** (7 connections) — `src/services/stale.service.ts`
- **.sweepOrg()** (4 connections) — `src/services/stale.service.ts`
- **createMockOctokit()** (3 connections) — `tests/unit/handlers/automation.handler.test.ts`
- **.constructor()** (3 connections) — `src/handlers/base-handler.ts`
- **.constructor()** (2 connections) — `src/commands/triage.command.ts`
- **createIssueContext()** (2 connections) — `tests/unit/handlers/automation.handler.test.ts`
- **createPRContext()** (2 connections) — `tests/unit/handlers/automation.handler.test.ts`
- **createContext()** (2 connections) — `tests/unit/handlers/governance.handler.test.ts`
- **createMockOctokit()** (2 connections) — `tests/unit/handlers/governance.handler.test.ts`
- **createContext()** (2 connections) — `tests/unit/handlers/stale.handler.test.ts`
- **createMockOctokit()** (2 connections) — `tests/unit/handlers/stale.handler.test.ts`
- **.buildCloseMessage()** (2 connections) — `src/services/stale.service.ts`
- **.buildStaleMessage()** (2 connections) — `src/services/stale.service.ts`
- **.constructor()** (2 connections) — `src/services/stale.service.ts`
- **.formatDate()** (2 connections) — `src/services/stale.service.ts`
- **StaleSweepResult** (2 connections) — `src/services/stale.service.ts`
- *... and 10 more nodes in this community*

## Relationships

- [[Core Interfaces and Types]] (19 shared connections)
- [[Slash Commands]] (16 shared connections)
- [[Middleware Pipeline]] (7 shared connections)
- [[GitHub Client Adapter]] (3 shared connections)
- [[Configuration and Errors]] (2 shared connections)
- [[YAML Config Provider]] (1 shared connections)
- [[Automation Handler]] (1 shared connections)

## Source Files

- `src/commands/triage.command.ts`
- `src/core/interfaces.ts`
- `src/handlers/base-handler.ts`
- `src/services/stale.service.ts`
- `tests/unit/handlers/automation.handler.test.ts`
- `tests/unit/handlers/governance.handler.test.ts`
- `tests/unit/handlers/stale.handler.test.ts`
- `tests/unit/services/stale.service.test.ts`

## Audit Trail

- EXTRACTED: 165 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*