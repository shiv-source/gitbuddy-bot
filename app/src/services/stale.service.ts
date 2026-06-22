/**
 * StaleService — pure business logic for stale issue detection and remediation.
 *
 * Responsibilities:
 *   - Find issues with no activity past the stale threshold
 *   - Mark them with a configurable stale label + comment
 *   - Close issues that remain stale past the close threshold
 *
 * Depends only on IGitHubClient and IConfigProvider (both interfaces).
 * No Probot, no Octokit, no framework dependency.
 * Stateless — each method is pure logic operating on its inputs.
 *
 * Algorithm (two-phase, per repo):
 *   Phase 1 — Mark: find open issues without the stale label that haven't been
 *             updated in > staleAfterDays days. Add stale label + comment.
 *   Phase 2 — Close: find open issues WITH the stale label that haven't been
 *             updated in > closeAfterDays days. Close + comment.
 *
 * The stale comment bumps updated_at, serving as the clock-start for closeAfterDays.
 * If anyone comments on a stale issue, updated_at resets the close clock.
 * Users must manually remove the stale label to fully un-stale an issue.
 */

import { injectable, inject } from 'inversify';
import { TYPES } from '../di/types.js';
import type { IGitHubClient, IConfigProvider, ILogger, IStaleService, StaleSweepResult } from '../core/interfaces.js';

@injectable()
export class StaleService implements IStaleService {
  constructor(@inject(TYPES.Logger) private readonly logger: ILogger) {}

  /**
   * Sweep a single repo for stale issues.
   *
   * Phase 1 — Mark: issues without the stale label, last updated > staleAfterDays ago.
   * Phase 2 — Close: issues with the stale label, last updated > closeAfterDays ago.
   */
  async sweepRepo(
    octokit: IGitHubClient,
    owner: string,
    repo: string,
    config: IConfigProvider,
  ): Promise<StaleSweepResult> {
    const staleLabel = config.get<string>('automation.staleLabel', 'stale');
    const staleAfterDays = config.get<number>('automation.staleAfterDays', 60);
    const closeAfterDays = config.get<number>('automation.closeAfterDays', 7);

    const now = new Date();
    const staleCutoff = new Date(now.getTime() - staleAfterDays * 24 * 60 * 60 * 1000);
    const closeCutoff = new Date(now.getTime() - closeAfterDays * 24 * 60 * 60 * 1000);

    const result: StaleSweepResult = {
      markedStale: 0,
      closed: 0,
      reposSwept: 1,
      errors: 0,
    };

    try {
      // Phase 1 query: open issues WITHOUT the stale label, updated before stale cutoff.
      // GitHub search syntax: updated:<YYYY-MM-DD = "updated strictly before this date".
      const staleCandidates = await octokit.searchIssues(
        owner,
        repo,
        `is:open -label:"${staleLabel}" updated:<${this.formatDate(staleCutoff)}`,
        undefined,
      );

      // Phase 2 query: open issues WITH the stale label.
      const staleIssues = await octokit.searchIssues(
        owner,
        repo,
        `is:open label:"${staleLabel}"`,
      );

      // ── Phase 1: Mark non-stale issues as stale ──────────────
      for (const issue of staleCandidates) {
        if (issue.labels.includes(staleLabel)) continue;

        try {
          await octokit.updateIssue(owner, repo, issue.number, {
            labels: [...issue.labels, staleLabel],
          });

          const staleMessage = this.buildStaleMessage(staleAfterDays, closeAfterDays);
          await octokit.createIssueComment(owner, repo, issue.number, staleMessage);

          result.markedStale++;

          this.logger.info(`Marked #${issue.number} as stale`, {
            repo: `${owner}/${repo}`,
            issueNumber: issue.number,
          });
        } catch (error) {
          result.errors++;
          this.logger.error(`Failed to mark #${issue.number} as stale`, error as Error, {
            repo: `${owner}/${repo}`,
            issueNumber: issue.number,
          });
        }
      }

      // ── Phase 2: Close stale issues past the close threshold ─
      for (const issue of staleIssues) {
        try {
          const updatedAt = new Date(issue.updatedAt);

          if (updatedAt <= closeCutoff) {
            await octokit.updateIssue(owner, repo, issue.number, { state: 'closed' });

            const closeMessage = this.buildCloseMessage(closeAfterDays);
            await octokit.createIssueComment(owner, repo, issue.number, closeMessage);

            result.closed++;

            const daysSinceUpdate = Math.round(
              (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24),
            );

            this.logger.info(`Closed stale issue #${issue.number}`, {
              repo: `${owner}/${repo}`,
              issueNumber: issue.number,
              daysSinceUpdate,
            });
          }
          // Otherwise: leave alone — either freshly marked stale or recent activity
          // reset the close clock. The stale label stays until manually removed.
        } catch (error) {
          result.errors++;
          this.logger.error(
            `Failed to process stale issue #${issue.number}`,
            error as Error,
            {
              repo: `${owner}/${repo}`,
              issueNumber: issue.number,
            },
          );
        }
      }
    } catch (error) {
      result.errors++;
      this.logger.error(`Failed to sweep repo ${owner}/${repo}`, error as Error, {
        repo: `${owner}/${repo}`,
      });
    }

    return result;
  }

  /**
   * Sweep all repos in an org.
   * Uses searchRepos to discover repos, then calls sweepRepo for each.
   */
  async sweepOrg(
    octokit: IGitHubClient,
    org: string,
    config: IConfigProvider,
  ): Promise<StaleSweepResult> {
    const repos = await octokit.searchRepos(`org:${org} archived:false`);

    const aggregate: StaleSweepResult = {
      markedStale: 0,
      closed: 0,
      reposSwept: 0,
      errors: 0,
    };

    this.logger.info(`Sweeping ${repos.length} repos in org ${org} for stale issues`);

    for (const repo of repos) {
      if (repo.archived) continue;

      const result = await this.sweepRepo(octokit, repo.owner, repo.repo, config);

      aggregate.markedStale += result.markedStale;
      aggregate.closed += result.closed;
      aggregate.reposSwept += result.reposSwept;
      aggregate.errors += result.errors;
    }

    this.logger.info('Org stale sweep complete', { org, ...aggregate });

    return aggregate;
  }

  // ── Private helpers ───────────────────────────────────────────

  private buildStaleMessage(staleAfterDays: number, closeAfterDays: number): string {
    return [
      `> 🤖 This issue has been marked as **stale** because it has had no activity for ${staleAfterDays} days.`,
      `> Remove the stale label or leave a comment to keep this issue open.`,
      `> If there is no further activity, this issue will be automatically closed in ${closeAfterDays} days.`,
    ].join('\n');
  }

  private buildCloseMessage(closeAfterDays: number): string {
    return [
      `> 🤖 This issue has been automatically **closed** after remaining inactive for an additional ${closeAfterDays} days since being marked as stale.`,
      `> Feel free to reopen this issue if it is still relevant.`,
    ].join('\n');
  }

  /** Format a Date as YYYY-MM-DD for GitHub search queries. */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
