/**
 * Base handler — Template Method pattern.
 *
 * Every domain handler extends this class. The template method defines the
 * standard pipeline: validate → enrich → process → respond.
 *
 * Subclasses override only the steps they need. This enforces consistency
 * across all handlers (error handling, logging, result format).
 *
 * L in SOLID: any subclass can substitute for IEventHandler.
 *
 * Note: IGitHubClient is NOT a constructor parameter — it arrives per-event
 * via context.octokit. This is because Probot provides an installation-scoped
 * Octokit on each webhook delivery, not a single shared client.
 */

import { injectable, inject } from 'inversify';
import { TYPES } from '../di/types.js';
import type { IEventHandler, ILogger, IConfigProvider } from '../core/interfaces.js';
import type { EventContext, HandlerResult } from '../core/types.js';
import { HandlerError } from '../core/errors.js';

@injectable()
export abstract class BaseHandler<TPayload = unknown> implements IEventHandler<TPayload> {
  abstract readonly name: string;
  abstract readonly events: string[];

  constructor(
    @inject(TYPES.Logger) protected readonly logger: ILogger,
    @inject(TYPES.ConfigProvider) protected readonly config: IConfigProvider,
  ) {}

  // ── Template Method ─────────────────────────────────────────

  async handle(context: EventContext<TPayload>): Promise<HandlerResult> {
    const start = Date.now();

    try {
      this.validate(context);
      const enriched = await this.enrich(context);
      const result = await this.process(enriched);
      await this.respond(context, result);

      this.logger.info(`Handler "${this.name}" completed`, {
        event: context.name,
        duration: Date.now() - start,
        actionTaken: result.actionTaken,
      });

      return result;
    } catch (error) {
      throw new HandlerError(this.name, error instanceof Error ? error : new Error(String(error)));
    }
  }

  // ── Hooks (override in subclasses) ──────────────────────────

  /** Validate the event before processing. Throw ValidationError to reject. */
  protected validate(_context: EventContext<TPayload>): void {
    // Default: accept everything
  }

  /** Fetch additional data needed for processing. */
  protected async enrich(context: EventContext<TPayload>): Promise<EventContext<TPayload>> {
    return context;
  }

  /** Core business logic. Subclasses MUST implement this. */
  protected abstract process(context: EventContext<TPayload>): Promise<HandlerResult>;

  /** Post a response (comment, label, check run, etc.). */
  protected async respond(_context: EventContext<TPayload>, _result: HandlerResult): Promise<void> {
    // Default: no response
  }
}
