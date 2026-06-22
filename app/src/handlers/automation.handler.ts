/**
 * Automation handler — PR/issue labeling, assignment, and stale management.
 *
 * Events:
 *   - issues.opened        → apply default labels + rule-based labels
 *   - pull_request.opened  → apply default labels + rule-based labels + auto-assign reviewers
 *   - issues.labeled       → trigger downstream actions from label changes
 */

import { BaseHandler } from './base-handler.js';
import { injectable } from 'inversify';
import type { EventContext, HandlerResult } from '../core/types.js';
import { NO_ACTION } from '../core/types.js';
import type { LabelRule } from '../core/types.js';

interface IssuePayload {
  action?: string;
  issue?: {
    number: number;
    title: string;
    body?: string | null;
    user?: { login: string };
  };
  label?: { name: string };
  pull_request?: {
    number: number;
    title: string;
    body?: string | null;
    user?: { login: string };
  };
}

@injectable()
export class AutomationHandler extends BaseHandler {
  readonly name = 'automation';
  readonly events = [
    'issues.opened',
    'pull_request.opened',
    'issues.labeled',
  ];

  protected async process(context: EventContext): Promise<HandlerResult> {
    switch (context.name) {
      case 'issues.opened':
        return this.handleIssueOpened(context as EventContext<IssuePayload>);
      case 'pull_request.opened':
        return this.handlePROpened(context as EventContext<IssuePayload>);
      case 'issues.labeled':
        return this.handleLabeled(context as EventContext<IssuePayload>);
      default:
        return NO_ACTION;
    }
  }

  private async handleIssueOpened(context: EventContext<IssuePayload>): Promise<HandlerResult> {
    const payload = context.payload;
    const issueNumber = payload.issue?.number;
    if (!issueNumber) return NO_ACTION;

    const allLabels = this.collectLabels(
      payload.issue?.title ?? '',
      payload.issue?.body ?? null,
    );

    if (allLabels.length === 0) return NO_ACTION;

    await context.octokit.addLabels(context.repo.owner, context.repo.repo, issueNumber, allLabels);

    return {
      summary: `Applied labels to #${issueNumber}: ${allLabels.join(', ')}`,
      actionTaken: true,
      metadata: { issueNumber, labels: allLabels },
    };
  }

  private async handlePROpened(context: EventContext<IssuePayload>): Promise<HandlerResult> {
    const payload = context.payload;
    // PRs carry issue data AND pull_request data — prefer PR for title/body
    const prNumber = payload.pull_request?.number ?? payload.issue?.number;
    const prTitle = payload.pull_request?.title ?? payload.issue?.title ?? '';
    const prBody = payload.pull_request?.body ?? payload.issue?.body ?? null;
    const author = payload.pull_request?.user?.login ?? payload.issue?.user?.login;
    if (!prNumber) return NO_ACTION;

    const actions: string[] = [];

    // ── Label rules (default + pattern-based) ──────────────────
    const allLabels = this.collectLabels(prTitle, prBody);

    if (allLabels.length > 0) {
      await context.octokit.addLabels(context.repo.owner, context.repo.repo, prNumber, allLabels);
      actions.push(`applied labels: ${allLabels.join(', ')}`);
    }

    // ── Auto-assign reviewer ───────────────────────────────────
    const org = context.org;
    const teamSlug = this.config.get<string>('automation.reviewerTeam', '');

    if (org && teamSlug) {
      const members = await context.octokit.getTeamMembers(org, teamSlug);
      const candidates = members.filter((m) => m.login !== author);

      if (candidates.length > 0) {
        const reviewer = candidates[0].login;
        await context.octokit.requestReviewers(
          context.repo.owner,
          context.repo.repo,
          prNumber,
          [reviewer],
        );
        actions.push(`assigned reviewer: ${reviewer}`);
      }
    }

    if (actions.length === 0) return NO_ACTION;

    return {
      summary: `PR #${prNumber}: ${actions.join('; ')}`,
      actionTaken: true,
      metadata: { prNumber, actions },
    };
  }

  private async handleLabeled(context: EventContext<IssuePayload>): Promise<HandlerResult> {
    const label = context.payload?.label?.name;
    this.logger.debug(`Issue labeled: ${label}`, {
      label,
      repo: `${context.repo.owner}/${context.repo.repo}`,
    });
    return NO_ACTION;
  }

  // ── Label collection ──────────────────────────────────────

  /**
   * Collect all labels that should be applied to a new issue or PR.
   *
   * Order: default labels first, then rule-based labels.
   * Duplicates are removed (rule-based labels take precedence over defaults).
   */
  private collectLabels(title: string, body: string | null): string[] {
    const defaultLabels = this.config.get<string[]>('automation.defaultIssueLabels', []);
    const labelRules = this.config.get<LabelRule[]>('automation.labelRules', []);

    const labels = new Set<string>();

    // Default labels go in first
    for (const label of defaultLabels) {
      labels.add(label);
    }

    // Rule-based labels: match title/body against each rule's regex pattern
    const textToMatch = [title, body ?? ''].join('\n');

    for (const rule of labelRules) {
      if (this.ruleMatches(rule, textToMatch)) {
        labels.add(rule.label);
      }
    }

    return Array.from(labels);
  }

  /**
   * Test whether a label rule matches the given text.
   * The rule's pattern is compiled as a regex and tested against the text.
   * Fail-safe: invalid regexes log a warning and do not match.
   */
  private ruleMatches(rule: LabelRule, text: string): boolean {
    try {
      const regex = new RegExp(rule.pattern, 'i');
      return regex.test(text);
    } catch {
      this.logger.warn(`Invalid label rule pattern: /${rule.pattern}/`, {
        ruleLabel: rule.label,
      });
      return false;
    }
  }
}
