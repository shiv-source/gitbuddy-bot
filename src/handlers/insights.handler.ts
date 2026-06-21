/**
 * Insights handler — DORA metrics collection and CI health monitoring.
 *
 * Events:
 *   - check_run.completed     → track CI pass/fail rates
 *   - pull_request.closed     → track lead time for changes
 */

import { BaseHandler } from './base-handler.js';
import type { EventContext, HandlerResult } from '../core/types.js';
import { NO_ACTION } from '../core/types.js';

interface CheckRunPayload {
  check_run?: {
    id: number;
    name: string;
    conclusion: string;
    head_sha: string;
  };
}

interface PullRequestClosedPayload {
  pull_request?: {
    number: number;
    merged: boolean;
    created_at: string;
    merged_at?: string;
  };
}

export class InsightsHandler extends BaseHandler {
  readonly name = 'insights';
  readonly events = [
    'check_run.completed',
    'pull_request.closed',
  ];

  protected async process(context: EventContext): Promise<HandlerResult> {
    if (!this.config.get<boolean>('insights.collectDoraMetrics', false)) {
      return NO_ACTION;
    }

    switch (context.name) {
      case 'check_run.completed':
        return this.handleCheckRunCompleted(context as EventContext<CheckRunPayload>);
      case 'pull_request.closed':
        return this.handlePRClosed(context as EventContext<PullRequestClosedPayload>);
      default:
        return NO_ACTION;
    }
  }

  private async handleCheckRunCompleted(context: EventContext<CheckRunPayload>): Promise<HandlerResult> {
    const checkRun = context.payload?.check_run;
    if (!checkRun) return NO_ACTION;

    const threshold = this.config.get<number>('insights.ciHealthThreshold', 0.9);

    this.logger.info('CI check completed', {
      checkName: checkRun.name,
      conclusion: checkRun.conclusion,
      repo: `${context.repo.owner}/${context.repo.repo}`,
      sha: checkRun.head_sha,
    });

    if (checkRun.conclusion === 'failure') {
      this.logger.warn(`CI failure on ${context.repo.owner}/${context.repo.repo}`, {
        checkName: checkRun.name,
        threshold,
      });
    }

    return {
      summary: `Recorded CI check "${checkRun.name}" → ${checkRun.conclusion}`,
      actionTaken: true,
      metadata: { checkName: checkRun.name, conclusion: checkRun.conclusion },
    };
  }

  private async handlePRClosed(context: EventContext<PullRequestClosedPayload>): Promise<HandlerResult> {
    const pr = context.payload?.pull_request;
    if (!pr?.merged || !pr.merged_at || !pr.created_at) return NO_ACTION;

    const createdAt = new Date(pr.created_at);
    const mergedAt = new Date(pr.merged_at);
    const leadTimeHours = (mergedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    this.logger.info('PR merged — lead time recorded', {
      prNumber: pr.number,
      repo: `${context.repo.owner}/${context.repo.repo}`,
      leadTimeHours: Math.round(leadTimeHours * 10) / 10,
    });

    return {
      summary: `Recorded lead time for PR #${pr.number}: ${Math.round(leadTimeHours)}h`,
      actionTaken: true,
      metadata: { prNumber: pr.number, leadTimeHours },
    };
  }
}
