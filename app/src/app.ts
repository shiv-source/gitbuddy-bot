/**
 * GitBuddyBot — the central application class.
 *
 * Owns handler registration, middleware setup, and lifecycle.
 * The single place where all event → handler wiring happens.
 *
 * Creates an OctokitClient per-event from Probot's installation-scoped
 * context.octokit — each webhook delivery gets its own authenticated client.
 *
 * S in SOLID: this class has ONE responsibility — wiring.
 */

import type { Probot } from 'probot';
import type { IEventHandler, ILogger } from './core/interfaces.js';
import { OctokitClient } from './infrastructure/github/octokit-client.js';
import { ContextEnricher } from './middleware/context-enricher.js';
import { RateLimiter } from './middleware/rate-limiter.js';
import { ErrorHandler } from './middleware/error-handler.js';

export class GitBuddyBotApp {
  private enricher: ContextEnricher;
  private rateLimiter: RateLimiter;
  private errorHandler: ErrorHandler;

  constructor(
    private readonly probot: Probot,
    private readonly handlers: IEventHandler[],
    logger: ILogger,
  ) {
    this.enricher = new ContextEnricher(logger);
    this.rateLimiter = new RateLimiter(logger);
    this.errorHandler = new ErrorHandler(logger, { reportToIssue: true });
  }

  /** Wire all handlers to their events. Call once during bootstrap. */
  registerAll(): void {
    for (const handler of this.handlers) {
      for (const event of handler.events) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.probot.on(event as any, async (ctx: { octokit: unknown; name: string; id: string; payload: unknown }) => {
          // 1. Create per-event authenticated GitHub client
          const octokit = new OctokitClient(ctx.octokit);

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
    console.log(`🤖 GitBuddy Bot registered ${this.handlers.length} handlers for ${uniqueEvents.length} events`);
  }

  /** Start the app: register handlers and begin processing webhooks. */
  async start(): Promise<void> {
    this.registerAll();
    console.log('🤖 GitBuddy Bot started');
  }
}
