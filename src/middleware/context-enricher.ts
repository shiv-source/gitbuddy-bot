/**
 * Context enricher — extracts and normalizes repo, org, and sender info
 * from the raw webhook payload before the handler sees it.
 *
 * Chain of Responsibility: first middleware in the chain. Ensures every
 * handler receives a consistent EventContext regardless of event type.
 */

import type { EventContext, RepoRef } from '../core/types.js';
import type { ILogger } from '../core/interfaces.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProbotContext = any;

export class ContextEnricher {
  constructor(private readonly logger: ILogger) {}

  /** Returns context WITHOUT octokit — app.ts adds the per-event client. */
  enrich(ctx: ProbotContext): Omit<EventContext, 'octokit'> {
    const repo = this.extractRepo(ctx);
    const org = this.extractOrg(ctx);
    const sender = ctx.payload?.sender?.login ?? 'unknown';

    const enriched = {
      name: ctx.name ?? 'unknown',
      deliveryId: ctx.id ?? 'unknown',
      payload: ctx.payload ?? {},
      repo,
      org,
      sender,
    };

    this.logger.debug('Context enriched', {
      event: enriched.name,
      repo: `${repo.owner}/${repo.repo}`,
      org,
      sender,
      deliveryId: enriched.deliveryId,
    });

    return enriched;
  }

  private extractRepo(ctx: ProbotContext): RepoRef {
    const repo = ctx.payload?.repository ?? ctx.repo?.();
    if (repo) {
      return {
        owner: repo.owner?.login ?? repo.owner ?? 'unknown',
        repo: repo.name ?? 'unknown',
      };
    }
    return { owner: 'unknown', repo: 'unknown' };
  }

  private extractOrg(ctx: ProbotContext): string | undefined {
    const org = ctx.payload?.organization ?? ctx.payload?.org;
    return org?.login ?? org ?? undefined;
  }
}
