# Command System

> 63 nodes · cohesion 0.06

## Key Concepts

- **index.ts** (29 connections) — `app/src/index.ts`
- **ILogger** (21 connections) — `app/src/core/interfaces.ts`
- **IConfigProvider** (14 connections) — `app/src/core/interfaces.ts`
- **IGitHubClient** (14 connections) — `app/src/core/interfaces.ts`
- **stale.handler.ts** (14 connections) — `app/src/handlers/stale.handler.ts`
- **automation.handler.test.ts** (13 connections) — `app/tests/unit/handlers/automation.handler.test.ts`
- **stale.handler.test.ts** (12 connections) — `app/tests/unit/handlers/stale.handler.test.ts`
- **stale.service.test.ts** (12 connections) — `app/tests/unit/services/stale.service.test.ts`
- **CommandContext** (9 connections) — `app/src/core/interfaces.ts`
- **ICommand** (9 connections) — `app/src/core/interfaces.ts`
- **StaleService** (9 connections) — `app/src/services/stale.service.ts`
- **ProbotLogger** (8 connections) — `app/src/infrastructure/logging/probot-logger.ts`
- **stale.service.ts** (8 connections) — `app/src/services/stale.service.ts`
- **command-router.ts** (7 connections) — `app/src/commands/command-router.ts`
- **triage.command.ts** (7 connections) — `app/src/commands/triage.command.ts`
- **CommandResult** (7 connections) — `app/src/core/interfaces.ts`
- **.sweepRepo()** (7 connections) — `app/src/services/stale.service.ts`
- **CommandRouter** (6 connections) — `app/src/commands/command-router.ts`
- **label.command.ts** (6 connections) — `app/src/commands/label.command.ts`
- **shipit.command.ts** (6 connections) — `app/src/commands/shipit.command.ts`
- **probot-logger.ts** (6 connections) — `app/src/infrastructure/logging/probot-logger.ts`
- **TriageCommand** (5 connections) — `app/src/commands/triage.command.ts`
- **LabelCommand** (4 connections) — `app/src/commands/label.command.ts`
- **ShipitCommand** (4 connections) — `app/src/commands/shipit.command.ts`
- **.sweepOrg()** (4 connections) — `app/src/services/stale.service.ts`
- *... and 38 more nodes in this community*

## Relationships

- [[Core Interfaces]] (25 shared connections)
- [[Event Handlers]] (24 shared connections)
- [[Configuration & Errors]] (14 shared connections)
- [[YAML Config Provider]] (2 shared connections)
- [[Context Enrichment]] (2 shared connections)

## Source Files

- `app/src/commands/command-router.ts`
- `app/src/commands/label.command.ts`
- `app/src/commands/shipit.command.ts`
- `app/src/commands/triage.command.ts`
- `app/src/core/interfaces.ts`
- `app/src/handlers/base-handler.ts`
- `app/src/handlers/stale.handler.ts`
- `app/src/index.ts`
- `app/src/infrastructure/logging/probot-logger.ts`
- `app/src/services/stale.service.ts`
- `app/tests/unit/handlers/automation.handler.test.ts`
- `app/tests/unit/handlers/stale.handler.test.ts`
- `app/tests/unit/services/stale.service.test.ts`

## Audit Trail

- EXTRACTED: 303 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*