/**
 * Symbol tokens for InversifyJS dependency injection.
 *
 * Every injectable dependency gets a Symbol.for(...) token.
 * Name matches the interface (e.g. 'Logger' for ILogger, 'Cache' for ICache).
 *
 * Group tokens (Middleware, Handler, Command) are used with @multiInject
 * for auto-discovery. Individual tokens enable explicit resolution when needed.
 */

export const TYPES = {
  // ── Infrastructure ──────────────────────────────────────────
  Logger: Symbol.for('Logger'),
  ConfigProvider: Symbol.for('ConfigProvider'),
  Cache: Symbol.for('Cache'),
  OctokitClientFactory: Symbol.for('OctokitClientFactory'),
  Probot: Symbol.for('Probot'),

  // ── Middleware ──────────────────────────────────────────────
  Middleware: Symbol.for('Middleware'), // @multiInject target
  ContextEnricher: Symbol.for('ContextEnricher'),
  RateLimiter: Symbol.for('RateLimiter'),
  ErrorHandler: Symbol.for('ErrorHandler'),

  // ── Handlers ───────────────────────────────────────────────
  Handler: Symbol.for('Handler'), // @multiInject target
  GovernanceHandler: Symbol.for('GovernanceHandler'),
  AutomationHandler: Symbol.for('AutomationHandler'),
  SecurityHandler: Symbol.for('SecurityHandler'),
  SyncHandler: Symbol.for('SyncHandler'),
  InsightsHandler: Symbol.for('InsightsHandler'),
  CopilotHandler: Symbol.for('CopilotHandler'),
  StaleHandler: Symbol.for('StaleHandler'),

  // ── Commands ───────────────────────────────────────────────
  Command: Symbol.for('Command'), // @multiInject target
  CommandRouter: Symbol.for('CommandRouter'),
  LabelCommand: Symbol.for('LabelCommand'),
  ShipitCommand: Symbol.for('ShipitCommand'),
  TriageCommand: Symbol.for('TriageCommand'),

  // ── Services ───────────────────────────────────────────────
  StaleService: Symbol.for('StaleService'),

  // ── App ────────────────────────────────────────────────────
  GitBuddyBotApp: Symbol.for('GitBuddyBotApp'),
} as const;
