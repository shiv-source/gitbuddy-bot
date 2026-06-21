/**
 * Watchdog Pro — GitHub App entry point.
 *
 * This is the composition root (Factory Pattern + Manual DI).
 * All concrete implementations are chosen and wired here.
 * No other file knows which ILogger, IGitHubClient, or IConfigProvider is in use.
 *
 * Dependency Inversion: handlers and services depend on I* interfaces.
 * This function (the composition root) is the ONLY place that picks
 * concrete implementations. Swap any adapter here without touching
 * handlers or services.
 */

import type { Probot } from 'probot';
import { WatchdogProApp } from './app.js';
import { ProbotLogger } from './infrastructure/logging/probot-logger.js';
import { YamlConfigProvider } from './infrastructure/config/yaml-config.js';

// Handlers
import { GovernanceHandler } from './handlers/governance.handler.js';
import { AutomationHandler } from './handlers/automation.handler.js';
import { SecurityHandler } from './handlers/security.handler.js';
import { SyncHandler } from './handlers/sync.handler.js';
import { InsightsHandler } from './handlers/insights.handler.js';
import { CopilotHandler } from './handlers/copilot.handler.js';
import { StaleHandler } from './handlers/stale.handler.js';

// Commands
import { CommandRouter } from './commands/command-router.js';
import { ShipitCommand } from './commands/shipit.command.js';
import { LabelCommand } from './commands/label.command.js';
import { TriageCommand } from './commands/triage.command.js';

/**
 * Probot entry point. Called automatically when the app starts.
 */
export default function createApp(probot: Probot): void {
  // ── Infrastructure (adapters) ───────────────────────────────
  const logger = new ProbotLogger(probot.log);
  const config = new YamlConfigProvider();

  // ── Commands ────────────────────────────────────────────────
  // Note: commands receive IGitHubClient per-invocation via CommandContext,
  // not at construction time. Registering them here for lifecycle management.
  const commandRouter = new CommandRouter(logger);
  commandRouter.register(new ShipitCommand());
  commandRouter.register(new LabelCommand());
  commandRouter.register(new TriageCommand(config));

  // ── Handlers ────────────────────────────────────────────────
  // IGitHubClient is per-event (context.octokit) — handlers get it from
  // the enriched event context, not from their constructor.
  // New domain = new handler file registered here. Nothing else changes.
  const handlers = [
    new GovernanceHandler(logger, config),
    new AutomationHandler(logger, config),
    new SecurityHandler(logger, config),
    new SyncHandler(logger, config),
    new InsightsHandler(logger, config),
    new CopilotHandler(logger, config),
    new StaleHandler(logger, config),
  ];

  // ── Bootstrap ───────────────────────────────────────────────
  const app = new WatchdogProApp(probot, handlers, logger);
  app.start();
}
