/**
 * GitBuddyBot — the central application class.
 *
 * Owns handler registration, middleware setup, and lifecycle.
 * The single place where all event → handler wiring happens.
 *
 * S in SOLID: this class has ONE responsibility — wiring.
 *
 * Dependencies are injected via InversifyJS:
 *   - Probot: bound as constant in index.ts (runtime value)
 *   - Handlers: @multiInject — all 7 discovered automatically
 *   - Middleware: @multiInject — all 3 discovered, sorted by priority
 *   - OctokitClientFactory: creates per-event IGitHubClient wrappers
 */

import { injectable, inject, multiInject } from 'inversify';
import { TYPES } from './di/types.js';
import type { Probot } from 'probot';
import type { IEventHandler, ILogger, IOctokitClientFactory, IMiddleware } from './core/interfaces.js';
import { ContextEnricher } from './middleware/context-enricher.js';
import { RateLimiter } from './middleware/rate-limiter.js';
import { ErrorHandler } from './middleware/error-handler.js';

@injectable()
export class GitBuddyBotApp {
  constructor(
    @inject(TYPES.Probot) private readonly probot: Probot,
    @multiInject(TYPES.Handler) private readonly handlers: IEventHandler[],
    @inject(TYPES.Logger) private readonly logger: ILogger,
    @multiInject(TYPES.Middleware) private readonly middleware: IMiddleware[],
    @inject(TYPES.OctokitClientFactory) private readonly octokitFactory: IOctokitClientFactory,
    @inject(TYPES.ContextEnricher) private readonly enricher: ContextEnricher,
    @inject(TYPES.RateLimiter) private readonly rateLimiter: RateLimiter,
    @inject(TYPES.ErrorHandler) private readonly errorHandler: ErrorHandler,
  ) {
    // Sort middleware by priority once (lowest runs first)
    this.middleware.sort((a, b) => a.priority - b.priority);
  }

  /** Wire all handlers to their events. Call once during bootstrap. */
  registerAll(): void {
    for (const handler of this.handlers) {
      for (const event of handler.events) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.probot.on(event as any, async (ctx: { octokit: unknown; name: string; id: string; payload: unknown }) => {
          // 1. Create per-event authenticated GitHub client via factory
          const octokit = this.octokitFactory.create(ctx.octokit);

          // 2. Enrich: normalize context + inject the client
          const context = { ...this.enricher.enrich(ctx), octokit };

          // 3. Rate limit: skip if the event type bucket is full
          if (!this.rateLimiter.acquire(event)) return;

          // 4. Handle: delegate to the domain handler with error wrapping
          await this.errorHandler.wrap(context, () => handler.handle(context))();
        });
      }
    }

    const registeredEvents = this.handlers.flatMap((h) => h.events);
    const uniqueEvents = [...new Set(registeredEvents)];
    this.logger.info('GitBuddy Bot registered handlers', {
      handlerCount: this.handlers.length,
      eventCount: uniqueEvents.length,
    });
  }

  /** Start the app: register handlers and begin processing webhooks. */
  async start(): Promise<void> {
    this.registerAll();
    this.logger.info('GitBuddy Bot started');
  }
}
