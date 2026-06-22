/**
 * InversifyJS container — central wiring point for all dependencies.
 *
 * Every binding is declared here. The composition root (index.ts) only binds
 * runtime-provided values (Probot) that aren't known at import time,
 * then calls container.get() to resolve the full dependency graph.
 *
 * Convention:
 *   - Infrastructure adapters: singleton
 *   - Middleware: singleton (ordered by priority)
 *   - Handlers: singleton
 *   - Commands: transient (created once via @multiInject in singleton CommandRouter)
 *   - Services: singleton
 *
 * Adding a new handler or command:
 *   1. Create the class with @injectable()
 *   2. Add a binding below
 *   3. That's it — @multiInject picks it up automatically
 */

import { Container } from 'inversify';
import { TYPES } from './types.js';

import type {
  ILogger,
  IConfigProvider,
  ICache,
  ICommandRouter,
  IEventHandler,
  ICommand,
  IStaleService,
  IMiddleware,
  IOctokitClientFactory,
} from '../core/interfaces.js';

// Infrastructure
import { WinstonLogger } from '../infrastructure/logging/winston-logger.js';
import { YamlConfigProvider } from '../infrastructure/config/yaml-config.js';
import { MemoryCache } from '../infrastructure/cache/memory-cache.js';
import { OctokitClientFactory } from '../infrastructure/github/octokit-factory.js';

// Middleware (ordered by priority: 100 → 200 → 300)
import { ContextEnricher } from '../middleware/context-enricher.js';
import { RateLimiter } from '../middleware/rate-limiter.js';
import { ErrorHandler } from '../middleware/error-handler.js';

// Commands
import { CommandRouter } from '../commands/command-router.js';
import { LabelCommand } from '../commands/label.command.js';
import { ShipitCommand } from '../commands/shipit.command.js';
import { TriageCommand } from '../commands/triage.command.js';

// Handlers
import { GovernanceHandler } from '../handlers/governance.handler.js';
import { AutomationHandler } from '../handlers/automation.handler.js';
import { SecurityHandler } from '../handlers/security.handler.js';
import { SyncHandler } from '../handlers/sync.handler.js';
import { InsightsHandler } from '../handlers/insights.handler.js';
import { CopilotHandler } from '../handlers/copilot.handler.js';
import { StaleHandler } from '../handlers/stale.handler.js';

// Services
import { StaleService } from '../services/stale.service.js';

const container = new Container();

// ── Infrastructure ────────────────────────────────────────────
// Logger: Winston-based, self-contained (no external deps needed).
// Console transport by default; file transport when LOG_FILE env is set.
container.bind<ILogger>(TYPES.Logger).to(WinstonLogger).inSingletonScope();

// ConfigProvider: uses toDynamicValue because the constructor has a default
// parameter (searchDir = process.cwd()) that Inversify can't resolve from
// the container without an explicit binding for 'string'.
container
  .bind<IConfigProvider>(TYPES.ConfigProvider)
  .toDynamicValue(() => new YamlConfigProvider())
  .inSingletonScope();

// Cache: in-memory TTL cache, now actually injected and used (RateLimiter).
container.bind<ICache>(TYPES.Cache).to(MemoryCache).inSingletonScope();

// Octokit factory: per-event client creation in GitBuddyBotApp.registerAll().
container
  .bind<IOctokitClientFactory>(TYPES.OctokitClientFactory)
  .to(OctokitClientFactory)
  .inSingletonScope();

// ── Middleware (sorted by priority) ──────────────────────────
// ContextEnricher (priority 100): runs first, normalizes context
// RateLimiter (priority 200):    runs second, checks concurrency caps
// ErrorHandler (priority 300):   runs last, wraps handler in try/catch
container.bind<IMiddleware>(TYPES.Middleware).to(ContextEnricher).inSingletonScope();
container.bind<IMiddleware>(TYPES.Middleware).to(RateLimiter).inSingletonScope();
container.bind<IMiddleware>(TYPES.Middleware).to(ErrorHandler).inSingletonScope();

// ── Commands ─────────────────────────────────────────────────
container.bind<ICommand>(TYPES.Command).to(LabelCommand);
container.bind<ICommand>(TYPES.Command).to(ShipitCommand);
container.bind<ICommand>(TYPES.Command).to(TriageCommand);
container
  .bind<ICommandRouter>(TYPES.CommandRouter)
  .to(CommandRouter)
  .inSingletonScope();

// ── Handlers ─────────────────────────────────────────────────
container.bind<IEventHandler>(TYPES.Handler).to(GovernanceHandler).inSingletonScope();
container.bind<IEventHandler>(TYPES.Handler).to(AutomationHandler).inSingletonScope();
container.bind<IEventHandler>(TYPES.Handler).to(SecurityHandler).inSingletonScope();
container.bind<IEventHandler>(TYPES.Handler).to(SyncHandler).inSingletonScope();
container.bind<IEventHandler>(TYPES.Handler).to(InsightsHandler).inSingletonScope();
container.bind<IEventHandler>(TYPES.Handler).to(CopilotHandler).inSingletonScope();
container.bind<IEventHandler>(TYPES.Handler).to(StaleHandler).inSingletonScope();

// ── Services ─────────────────────────────────────────────────
container
  .bind<IStaleService>(TYPES.StaleService)
  .to(StaleService)
  .inSingletonScope();

export { container };
