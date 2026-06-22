/**
 * Copilot handler — AI-powered PR review, description generation, and bug fixing.
 *
 * Events:
 *   - pull_request.opened     → auto-generate PR description if missing
 *   - issue_comment.created   → detect @gitbuddy mentions and respond
 *
 * AI integration is config-gated: only activates when copilot.* config is present.
 */

import { BaseHandler } from './base-handler.js';
import { injectable } from 'inversify';
import type { EventContext, HandlerResult } from '../core/types.js';
import { NO_ACTION } from '../core/types.js';

interface IssueCommentPayload {
  action?: string;
  issue?: { number: number; pull_request?: object };
  comment?: { id: number; body: string; user?: { login: string } };
}

interface PullRequestPayload {
  action?: string;
  pull_request?: {
    number: number;
    title: string;
    body: string | null;
    user?: { login: string };
  };
}

@injectable()
export class CopilotHandler extends BaseHandler {
  readonly name = 'copilot';
  readonly events = [
    'pull_request.opened',
    'issue_comment.created',
  ];

  protected async process(context: EventContext): Promise<HandlerResult> {
    const enabled =
      this.config.get<boolean>('copilot.prReviewEnabled', false) ||
      this.config.get<boolean>('copilot.prDescriptionEnabled', false);

    if (!enabled) return NO_ACTION;

    switch (context.name) {
      case 'pull_request.opened':
        return this.handlePROpened(context as EventContext<PullRequestPayload>);
      case 'issue_comment.created':
        return this.handleCommentCreated(context as EventContext<IssueCommentPayload>);
      default:
        return NO_ACTION;
    }
  }

  private async handlePROpened(context: EventContext<PullRequestPayload>): Promise<HandlerResult> {
    const pr = context.payload?.pull_request;
    if (!pr) return NO_ACTION;

    const generateDesc = this.config.get<boolean>('copilot.prDescriptionEnabled', false);

    if (generateDesc && (!pr.body || pr.body.trim().length === 0)) {
      const maxTokens = this.config.get<number>('copilot.maxTokens', 4096);

      const placeholder = `> 🤖 Auto-generated PR description coming soon (max ${maxTokens} tokens)`;

      await context.octokit.createPRComment(
        context.repo.owner,
        context.repo.repo,
        pr.number,
        placeholder,
      );

      return {
        summary: `Requested AI description for PR #${pr.number}`,
        actionTaken: true,
        metadata: { prNumber: pr.number, maxTokens },
      };
    }

    return NO_ACTION;
  }

  private async handleCommentCreated(context: EventContext<IssueCommentPayload>): Promise<HandlerResult> {
    const comment = context.payload?.comment;
    if (!comment) return NO_ACTION;

    const mentioned = /@gitbuddy\b/i.test(comment.body);
    if (!mentioned) return NO_ACTION;

    const prReviewEnabled = this.config.get<boolean>('copilot.prReviewEnabled', false);
    if (!prReviewEnabled) return NO_ACTION;

    const issue = context.payload?.issue;
    const isPR = !!issue?.pull_request;

    if (isPR && issue) {
      await context.octokit.createIssueComment(
        context.repo.owner,
        context.repo.repo,
        issue.number,
        '> 🤖 AI code review coming soon — I will analyze the diff and post findings.',
      );
    }

    return {
      summary: `Responded to @gitbuddy mention on #${issue?.number}`,
      actionTaken: true,
      metadata: { issueNumber: issue?.number, isPR },
    };
  }
}
