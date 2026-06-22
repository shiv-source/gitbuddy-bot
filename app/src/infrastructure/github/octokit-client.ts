/**
 * Octokit adapter — implements IGitHubClient using a ProbotOctokit instance.
 *
 * Adapter pattern: services depend on IGitHubClient (domain-named methods),
 * never on raw Octokit API calls.
 *
 * Created per-event from `context.octokit` (Probot's installation-scoped
 * Octokit) — each webhook delivery gets its own authenticated client.
 *
 * Handles retry with exponential backoff and rate-limit detection.
 */

import { injectable } from 'inversify';
import type {
  IGitHubClient,
  RepoInfo,
  PullRequestInfo,
  CheckConclusion,
  CheckDetails,
  IssueSearchResult,
  IssueUpdate,
} from '../../core/interfaces.js';
import type { BranchProtection, TeamMember } from '../../core/types.js';
import { RateLimitError, GitHubApiError, NotFoundError } from '../../core/errors.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProbotOctokit = any;

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

@injectable()
export class OctokitClient implements IGitHubClient {
  constructor(private readonly octokit: ProbotOctokit) {}

  // ── Repos ───────────────────────────────────────────────────

  async getRepo(owner: string, repo: string): Promise<RepoInfo> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await this.withRetry<any>(() =>
      this.octokit.rest.repos.get({ owner, repo }),
    );
    return {
      owner: data.owner.login,
      repo: data.name,
      defaultBranch: data.default_branch,
      isPrivate: data.private,
      archived: data.archived,
    };
  }

  async createIssueComment(owner: string, repo: string, issueNumber: number, body: string): Promise<void> {
    await this.withRetry(() =>
      this.octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: issueNumber,
        body,
      }),
    );
  }

  async addLabels(owner: string, repo: string, issueNumber: number, labels: string[]): Promise<void> {
    await this.withRetry(() =>
      this.octokit.rest.issues.addLabels({
        owner,
        repo,
        issue_number: issueNumber,
        labels,
      }),
    );
  }

  async removeLabel(owner: string, repo: string, issueNumber: number, label: string): Promise<void> {
    await this.withRetry(() =>
      this.octokit.rest.issues.removeLabel({
        owner,
        repo,
        issue_number: issueNumber,
        name: label,
      }),
    );
  }

  // ── Pull Requests ───────────────────────────────────────────

  async getPullRequest(owner: string, repo: string, prNumber: number): Promise<PullRequestInfo> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await this.withRetry<any>(() =>
      this.octokit.rest.pulls.get({ owner, repo, pull_number: prNumber }),
    );
    return {
      number: data.number,
      title: data.title,
      body: data.body,
      state: data.state as 'open' | 'closed',
      author: data.user?.login ?? 'unknown',
      baseRef: data.base.ref,
      headRef: data.head.ref,
      labels: (data.labels ?? []).map((l: { name?: string } | string) =>
        typeof l === 'string' ? l : l.name ?? '',
      ),
      requestedReviewers: (data.requested_reviewers ?? []).map((r: { login: string }) => r.login),
    };
  }

  async requestReviewers(owner: string, repo: string, prNumber: number, reviewers: string[]): Promise<void> {
    await this.withRetry(() =>
      this.octokit.rest.pulls.requestReviewers({
        owner,
        repo,
        pull_number: prNumber,
        reviewers,
      }),
    );
  }

  async createPRComment(owner: string, repo: string, prNumber: number, body: string): Promise<void> {
    await this.withRetry(() =>
      this.octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body,
      }),
    );
  }

  // ── Branch Protection ───────────────────────────────────────

  async getBranchProtection(owner: string, repo: string, branch: string): Promise<BranchProtection | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await this.withRetry<any>(() =>
        this.octokit.rest.repos.getBranchProtection({
          owner,
          repo,
          branch,
        }),
      );
      return {
        branch,
        requiredReviews: data.required_pull_request_reviews?.required_approving_review_count ?? 0,
        requiredStatusChecks: data.required_status_checks?.contexts ?? [],
        enforceAdmins: data.enforce_admins?.enabled ?? false,
      };
    } catch (error: unknown) {
      if (
        (error as { status?: number })?.status === 404 ||
        error instanceof NotFoundError
      ) {
        return null;
      }
      throw error;
    }
  }

  async updateBranchProtection(owner: string, repo: string, branch: string, protection: BranchProtection): Promise<void> {
    await this.withRetry(() =>
      this.octokit.rest.repos.updateBranchProtection({
        owner,
        repo,
        branch,
        required_status_checks: {
          strict: true,
          contexts: protection.requiredStatusChecks,
        },
        required_pull_request_reviews: {
          required_approving_review_count: protection.requiredReviews,
        },
        enforce_admins: protection.enforceAdmins,
        restrictions: null,
      }),
    );
  }

  // ── Teams ───────────────────────────────────────────────────

  async getTeamMembers(org: string, teamSlug: string): Promise<TeamMember[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await this.withRetry<any>(() =>
      this.octokit.rest.teams.listMembersInOrg({
        org,
        team_slug: teamSlug,
      }),
    );
    return data.map((m: { login: string }) => ({ login: m.login }));
  }

  // ── Workflows ───────────────────────────────────────────────

  async dispatchWorkflow(owner: string, repo: string, workflowId: string, ref: string, inputs?: Record<string, string>): Promise<void> {
    await this.withRetry(() =>
      this.octokit.rest.actions.createWorkflowDispatch({
        owner,
        repo,
        workflow_id: workflowId,
        ref,
        inputs: inputs ?? {},
      }),
    );
  }

  // ── Checks ──────────────────────────────────────────────────

  async createCheckRun(owner: string, repo: string, name: string, headSha: string, conclusion: CheckConclusion, details?: CheckDetails): Promise<void> {
    await this.withRetry(() =>
      this.octokit.rest.checks.create({
        owner,
        repo,
        name,
        head_sha: headSha,
        status: 'completed',
        conclusion,
        output: details
          ? { title: details.title, summary: details.summary, text: details.text }
          : undefined,
      }),
    );
  }

  // ── Search ──────────────────────────────────────────────────

  async searchRepos(query: string): Promise<RepoInfo[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await this.withRetry<any>(() =>
      this.octokit.rest.search.repos({ q: query }),
    );
    return data.items.map((r: { owner: { login: string }; name: string; default_branch: string; private: boolean; archived: boolean }) => ({
      owner: r.owner.login,
      repo: r.name,
      defaultBranch: r.default_branch,
      isPrivate: r.private,
      archived: r.archived,
    }));
  }

  // ── Issues (stale management) ────────────────────────────────

  async searchIssues(owner: string, repo: string, query: string, since?: Date): Promise<IssueSearchResult[]> {
    const q = `repo:${owner}/${repo} is:issue ${query}` + (since ? ` updated:<${since.toISOString().split('T')[0]}` : '');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await this.withRetry<any>(() =>
      this.octokit.rest.search.issuesAndPullRequests({ q, per_page: 100 }),
    );
    return data.items.map(
      (item: {
        number: number;
        title: string;
        state: string;
        labels: Array<{ name: string } | string>;
        updated_at: string;
        html_url: string;
      }) => ({
        number: item.number,
        title: item.title,
        state: item.state as 'open' | 'closed',
        labels: (item.labels ?? []).map((l) => (typeof l === 'string' ? l : l.name ?? '')),
        updatedAt: item.updated_at,
        url: item.html_url,
      }),
    );
  }

  async updateIssue(owner: string, repo: string, issueNumber: number, update: IssueUpdate): Promise<void> {
    const body: Record<string, unknown> = {};
    if (update.state !== undefined) body.state = update.state;
    if (update.labels !== undefined) body.labels = update.labels;
    if (Object.keys(body).length === 0) return;

    await this.withRetry(() =>
      this.octokit.rest.issues.update({
        owner,
        repo,
        issue_number: issueNumber,
        ...body,
      }),
    );
  }

  // ── Retry Logic ─────────────────────────────────────────────

  private async withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error: unknown) {
        if (attempt === retries) throw this.wrapError(error);

        const status = (error as { status?: number })?.status;
        const retryAfter = this.parseRetryAfter(error);

        // Rate limited — wait and retry
        if (status === 429 || status === 403) {
          const delay = (retryAfter && retryAfter > 0)
            ? retryAfter * 1000
            : BASE_DELAY_MS * 2 ** (attempt - 1);
          await this.sleep(delay);
          continue;
        }

        // Server errors are retryable
        if (status && status >= 500) {
          await this.sleep(BASE_DELAY_MS * 2 ** (attempt - 1));
          continue;
        }

        // Client errors (except rate limits) are not retryable
        throw this.wrapError(error);
      }
    }

    /* istanbul ignore next */ throw new GitHubApiError('Max retries exceeded');
  }

  private wrapError(error: unknown): Error {
    const status = (error as { status?: number })?.status ?? 500;
    const message = (error as { message?: string })?.message ?? 'Unknown GitHub API error';

    if (status === 429) {
      return new RateLimitError(this.parseRetryAfter(error) ?? 60);
    }
    if (status === 404) {
      return new NotFoundError('GitHub resource', message);
    }
    return new GitHubApiError(message, status);
  }

  private parseRetryAfter(error: unknown): number | undefined {
    const headers = (error as { response?: { headers?: Record<string, string> } })?.response?.headers;
    const retryAfter = headers?.['retry-after'] ?? headers?.['x-ratelimit-reset'];
    if (retryAfter) {
      const parsed = parseInt(retryAfter, 10);
      if (!isNaN(parsed)) return parsed > Date.now() / 1000 ? parsed - Math.floor(Date.now() / 1000) : parsed;
    }
    return undefined;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
