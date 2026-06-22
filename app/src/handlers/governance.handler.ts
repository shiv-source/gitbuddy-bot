/**
 * Governance handler — org-wide policy enforcement and repo bootstrapping.
 *
 * Events:
 *   - repository.created      → auto-bootstrap new repos with platform defaults
 *   - branch_protection_rule.created → audit against required policy
 *   - branch_protection_rule.edited → audit against required policy
 */

import { BaseHandler } from './base-handler.js';
import { injectable } from 'inversify';
import type { EventContext, HandlerResult } from '../core/types.js';
import { NO_ACTION } from '../core/types.js';
import { ValidationError } from '../core/errors.js';

interface RepositoryCreatedPayload {
  repository?: { name: string; owner: { login: string } };
}

interface BranchProtectionPayload {
  repository?: { name: string; owner: { login: string } };
  rule?: { name: string; required_approving_review_count?: number };
}

@injectable()
export class GovernanceHandler extends BaseHandler {
  readonly name = 'governance';
  readonly events = [
    'repository.created',
    'branch_protection_rule.created',
    'branch_protection_rule.edited',
  ];

  protected validate(context: EventContext): void {
    if (!context.payload) {
      throw new ValidationError('Governance event missing payload');
    }
  }

  protected async process(context: EventContext): Promise<HandlerResult> {
    switch (context.name) {
      case 'repository.created':
        return this.handleRepoCreated(context as EventContext<RepositoryCreatedPayload>);
      case 'branch_protection_rule.created':
      case 'branch_protection_rule.edited':
        return this.handleBranchProtectionChange(context as EventContext<BranchProtectionPayload>);
      default:
        return NO_ACTION;
    }
  }

  private async handleRepoCreated(context: EventContext<RepositoryCreatedPayload>): Promise<HandlerResult> {
    const repo = context.repo;
    const patterns = this.config.get<string[]>('governance.autoBootstrapPatterns', []);

    if (patterns.length === 0) return NO_ACTION;

    const match = patterns.some((pattern: string) => {
      const regex = new RegExp(pattern);
      return regex.test(repo.repo);
    });

    if (!match) return NO_ACTION;

    const requiredChecks = this.config.get<string[]>('governance.requiredStatusChecks', []);
    const reviewCount = this.config.get<number>('governance.requiredReviewCount', 1);

    await context.octokit.updateBranchProtection(repo.owner, repo.repo, 'main', {
      branch: 'main',
      requiredReviews: reviewCount,
      requiredStatusChecks: requiredChecks,
      enforceAdmins: true,
    });

    return {
      summary: `Bootstrapped repo ${repo.owner}/${repo.repo} with branch protection`,
      actionTaken: true,
      metadata: { repo: `${repo.owner}/${repo.repo}`, requiredChecks, reviewCount },
    };
  }

  private async handleBranchProtectionChange(context: EventContext<BranchProtectionPayload>): Promise<HandlerResult> {
    const repo = context.repo;
    const existing = await context.octokit.getBranchProtection(repo.owner, repo.repo, 'main');
    const requiredChecks = this.config.get<string[]>('governance.requiredStatusChecks', []);
    const reviewCount = this.config.get<number>('governance.requiredReviewCount', 1);

    if (!existing) {
      await context.octokit.updateBranchProtection(repo.owner, repo.repo, 'main', {
        branch: 'main',
        requiredReviews: reviewCount,
        requiredStatusChecks: requiredChecks,
        enforceAdmins: true,
      });

      return {
        summary: `Enforced branch protection on ${repo.owner}/${repo.repo}/main`,
        actionTaken: true,
      };
    }

    const missingChecks = requiredChecks.filter((c) => !existing.requiredStatusChecks.includes(c));
    if (missingChecks.length > 0 || existing.requiredReviews < reviewCount) {
      await context.octokit.updateBranchProtection(repo.owner, repo.repo, 'main', {
        ...existing,
        requiredReviews: reviewCount,
        requiredStatusChecks: [...existing.requiredStatusChecks, ...missingChecks],
      });

      return {
        summary: `Corrected branch protection gaps on ${repo.owner}/${repo.repo}/main`,
        actionTaken: true,
        metadata: { missingChecks, requiredReviews: reviewCount },
      };
    }

    return NO_ACTION;
  }
}
