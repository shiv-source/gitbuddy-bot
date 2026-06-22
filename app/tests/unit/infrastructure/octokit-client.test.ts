/**
 * OctokitClient unit tests — comprehensive coverage of all methods and retry logic.
 */

import { jest, describe, it, beforeEach, expect } from '@jest/globals';
import { OctokitClient } from '../../../src/infrastructure/github/octokit-client.js';
import { RateLimitError, GitHubApiError, NotFoundError } from '../../../src/core/errors.js';

// Helper to create a mock Octokit with all REST endpoints
function createMockOctokit() {
  return {
    rest: {
      repos: {
        get: jest.fn(),
        getBranchProtection: jest.fn(),
        updateBranchProtection: jest.fn(),
      },
      issues: {
        createComment: jest.fn(),
        addLabels: jest.fn(),
        removeLabel: jest.fn(),
        update: jest.fn(),
      },
      pulls: {
        get: jest.fn(),
        requestReviewers: jest.fn(),
      },
      teams: {
        listMembersInOrg: jest.fn(),
      },
      actions: {
        createWorkflowDispatch: jest.fn(),
      },
      checks: {
        create: jest.fn(),
      },
      search: {
        repos: jest.fn(),
        issuesAndPullRequests: jest.fn(),
      },
    },
  };
}

// Mock API response data
const mockRepoData = {
  owner: { login: 'test-org' },
  name: 'test-repo',
  default_branch: 'main',
  private: false,
  archived: false,
};

const mockPRData = {
  number: 42,
  title: 'feat: something',
  body: 'description',
  state: 'open',
  user: { login: 'dev1' },
  base: { ref: 'main' },
  head: { ref: 'feature-branch' },
  labels: [{ name: 'enhancement' }, 'bug'],
  requested_reviewers: [{ login: 'reviewer1' }],
};

const mockBranchProtectionData = {
  required_pull_request_reviews: { required_approving_review_count: 1 },
  required_status_checks: { contexts: ['ci/build'] },
  enforce_admins: { enabled: true },
};

const mockTeamMembers = [{ login: 'member1' }, { login: 'member2' }];

const mockSearchReposData = {
  items: [
    { owner: { login: 'org' }, name: 'repo1', default_branch: 'main', private: false, archived: false },
  ],
};

const mockSearchIssuesData = {
  items: [
    {
      number: 5,
      title: 'stale issue',
      state: 'open',
      labels: [{ name: 'bug' }],
      updated_at: '2026-01-01T00:00:00Z',
      html_url: 'https://github.com/org/repo/issues/5',
    },
  ],
};

describe('OctokitClient', () => {
  let client: OctokitClient;
  let octokit: ReturnType<typeof createMockOctokit>;

  beforeEach(() => {
    octokit = createMockOctokit();
    client = new OctokitClient(octokit);
  });

  // ── Repos ───────────────────────────────────────────────────
  describe('getRepo', () => {
    it('fetches and maps repo data', async () => {
      octokit.rest.repos.get.mockResolvedValue({ data: mockRepoData });
      const result = await client.getRepo('test-org', 'test-repo');
      expect(result).toEqual({
        owner: 'test-org',
        repo: 'test-repo',
        defaultBranch: 'main',
        isPrivate: false,
        archived: false,
      });
    });
  });

  describe('createIssueComment', () => {
    it('creates a comment on an issue', async () => {
      octokit.rest.issues.createComment.mockResolvedValue({});
      await client.createIssueComment('org', 'repo', 1, 'hello');
      expect(octokit.rest.issues.createComment).toHaveBeenCalledWith({
        owner: 'org', repo: 'repo', issue_number: 1, body: 'hello',
      });
    });
  });

  describe('addLabels', () => {
    it('adds labels to an issue', async () => {
      octokit.rest.issues.addLabels.mockResolvedValue({});
      await client.addLabels('org', 'repo', 1, ['bug', 'enhancement']);
      expect(octokit.rest.issues.addLabels).toHaveBeenCalledWith({
        owner: 'org', repo: 'repo', issue_number: 1, labels: ['bug', 'enhancement'],
      });
    });
  });

  describe('removeLabel', () => {
    it('removes a label from an issue', async () => {
      octokit.rest.issues.removeLabel.mockResolvedValue({});
      await client.removeLabel('org', 'repo', 1, 'bug');
      expect(octokit.rest.issues.removeLabel).toHaveBeenCalledWith({
        owner: 'org', repo: 'repo', issue_number: 1, name: 'bug',
      });
    });
  });

  // ── Pull Requests ───────────────────────────────────────────
  describe('getPullRequest', () => {
    it('fetches and maps PR data', async () => {
      octokit.rest.pulls.get.mockResolvedValue({ data: mockPRData });
      const result = await client.getPullRequest('org', 'repo', 42);
      expect(result).toEqual({
        number: 42,
        title: 'feat: something',
        body: 'description',
        state: 'open',
        author: 'dev1',
        baseRef: 'main',
        headRef: 'feature-branch',
        labels: ['enhancement', 'bug'],
        requestedReviewers: ['reviewer1'],
      });
    });

    it('handles missing user login', async () => {
      octokit.rest.pulls.get.mockResolvedValue({
        data: { ...mockPRData, user: null },
      });
      const result = await client.getPullRequest('org', 'repo', 42);
      expect(result.author).toBe('unknown');
    });

    it('handles string labels and labels without name', async () => {
      octokit.rest.pulls.get.mockResolvedValue({
        data: { ...mockPRData, labels: ['simple-label', {}] },
      });
      const result = await client.getPullRequest('org', 'repo', 42);
      expect(result.labels).toEqual(['simple-label', '']);
    });

    it('handles null requested_reviewers', async () => {
      octokit.rest.pulls.get.mockResolvedValue({
        data: { ...mockPRData, requested_reviewers: null },
      });
      const result = await client.getPullRequest('org', 'repo', 42);
      expect(result.requestedReviewers).toEqual([]);
    });
  });

  describe('requestReviewers', () => {
    it('requests reviewers', async () => {
      octokit.rest.pulls.requestReviewers.mockResolvedValue({});
      await client.requestReviewers('org', 'repo', 42, ['user1']);
      expect(octokit.rest.pulls.requestReviewers).toHaveBeenCalledWith({
        owner: 'org', repo: 'repo', pull_number: 42, reviewers: ['user1'],
      });
    });
  });

  describe('createPRComment', () => {
    it('creates a PR comment', async () => {
      octokit.rest.issues.createComment.mockResolvedValue({});
      await client.createPRComment('org', 'repo', 5, 'LGTM');
      expect(octokit.rest.issues.createComment).toHaveBeenCalledWith({
        owner: 'org', repo: 'repo', issue_number: 5, body: 'LGTM',
      });
    });
  });

  // ── Branch Protection ───────────────────────────────────────
  describe('getBranchProtection', () => {
    it('fetches and maps branch protection', async () => {
      octokit.rest.repos.getBranchProtection.mockResolvedValue({ data: mockBranchProtectionData });
      const result = await client.getBranchProtection('org', 'repo', 'main');
      expect(result).toEqual({
        branch: 'main',
        requiredReviews: 1,
        requiredStatusChecks: ['ci/build'],
        enforceAdmins: true,
      });
    });

    it('returns null for 404 errors', async () => {
      octokit.rest.repos.getBranchProtection.mockRejectedValue({ status: 404 });
      const result = await client.getBranchProtection('org', 'repo', 'main');
      expect(result).toBeNull();
    });

    it('rethrows non-404 errors', async () => {
      const error = new Error('server error');
      octokit.rest.repos.getBranchProtection.mockRejectedValue(error);
      await expect(client.getBranchProtection('org', 'repo', 'main')).rejects.toThrow('server error');
    });
  });

  describe('updateBranchProtection', () => {
    it('updates branch protection', async () => {
      octokit.rest.repos.updateBranchProtection.mockResolvedValue({});
      await client.updateBranchProtection('org', 'repo', 'main', {
        branch: 'main', requiredReviews: 2, requiredStatusChecks: ['ci'], enforceAdmins: true,
      });
      expect(octokit.rest.repos.updateBranchProtection).toHaveBeenCalledWith({
        owner: 'org', repo: 'repo', branch: 'main',
        required_status_checks: { strict: true, contexts: ['ci'] },
        required_pull_request_reviews: { required_approving_review_count: 2 },
        enforce_admins: true,
        restrictions: null,
      });
    });
  });

  // ── Teams ───────────────────────────────────────────────────
  describe('getTeamMembers', () => {
    it('fetches team members', async () => {
      octokit.rest.teams.listMembersInOrg.mockResolvedValue({ data: mockTeamMembers });
      const result = await client.getTeamMembers('org', 'devs');
      expect(result).toEqual([{ login: 'member1' }, { login: 'member2' }]);
    });
  });

  // ── Workflows ───────────────────────────────────────────────
  describe('dispatchWorkflow', () => {
    it('dispatches with inputs', async () => {
      octokit.rest.actions.createWorkflowDispatch.mockResolvedValue({});
      await client.dispatchWorkflow('org', 'repo', 'ci.yml', 'main', { key: 'val' });
      expect(octokit.rest.actions.createWorkflowDispatch).toHaveBeenCalledWith({
        owner: 'org', repo: 'repo', workflow_id: 'ci.yml', ref: 'main', inputs: { key: 'val' },
      });
    });

    it('defaults inputs to empty object', async () => {
      octokit.rest.actions.createWorkflowDispatch.mockResolvedValue({});
      await client.dispatchWorkflow('org', 'repo', 'ci.yml', 'main');
      expect(octokit.rest.actions.createWorkflowDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ inputs: {} }),
      );
    });
  });

  // ── Checks ──────────────────────────────────────────────────
  describe('createCheckRun', () => {
    it('creates check run without details', async () => {
      octokit.rest.checks.create.mockResolvedValue({});
      await client.createCheckRun('org', 'repo', 'lint', 'abc123', 'success');
      expect(octokit.rest.checks.create).toHaveBeenCalledWith({
        owner: 'org', repo: 'repo', name: 'lint', head_sha: 'abc123',
        status: 'completed', conclusion: 'success', output: undefined,
      });
    });

    it('creates check run with details', async () => {
      octokit.rest.checks.create.mockResolvedValue({});
      await client.createCheckRun('org', 'repo', 'test', 'def456', 'failure', {
        title: 'Tests', summary: '3 failed', text: 'details...',
      });
      expect(octokit.rest.checks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          output: { title: 'Tests', summary: '3 failed', text: 'details...' },
        }),
      );
    });
  });

  // ── Search ──────────────────────────────────────────────────
  describe('searchRepos', () => {
    it('searches repos and maps results', async () => {
      octokit.rest.search.repos.mockResolvedValue({ data: mockSearchReposData });
      const result = await client.searchRepos('org:test-org');
      expect(result).toEqual([{
        owner: 'org', repo: 'repo1', defaultBranch: 'main', isPrivate: false, archived: false,
      }]);
    });
  });

  describe('searchIssues', () => {
    it('searches issues without since filter', async () => {
      octokit.rest.search.issuesAndPullRequests.mockResolvedValue({ data: mockSearchIssuesData });
      const result = await client.searchIssues('org', 'repo', 'is:open');
      expect(result).toHaveLength(1);
      expect(result[0].number).toBe(5);
      expect(result[0].labels).toEqual(['bug']);
    });

    it('searches issues with since filter', async () => {
      octokit.rest.search.issuesAndPullRequests.mockResolvedValue({ data: { items: [] } });
      const since = new Date('2026-01-01');
      await client.searchIssues('org', 'repo', 'is:open', since);
      expect(octokit.rest.search.issuesAndPullRequests).toHaveBeenCalledWith(
        expect.objectContaining({
          q: expect.stringContaining('updated:<2026-01-01'),
          per_page: 100,
        }),
      );
    });

    it('handles empty labels array', async () => {
      octokit.rest.search.issuesAndPullRequests.mockResolvedValue({
        data: { items: [{ ...mockSearchIssuesData.items[0], labels: null }] },
      });
      const result = await client.searchIssues('org', 'repo', 'is:open');
      expect(result[0].labels).toEqual([]);
    });
  });

  // ── Issues ──────────────────────────────────────────────────
  describe('updateIssue', () => {
    it('updates issue state', async () => {
      octokit.rest.issues.update.mockResolvedValue({});
      await client.updateIssue('org', 'repo', 1, { state: 'closed' });
      expect(octokit.rest.issues.update).toHaveBeenCalledWith({
        owner: 'org', repo: 'repo', issue_number: 1, state: 'closed',
      });
    });

    it('updates issue labels', async () => {
      octokit.rest.issues.update.mockResolvedValue({});
      await client.updateIssue('org', 'repo', 1, { labels: ['a', 'b'] });
      expect(octokit.rest.issues.update).toHaveBeenCalledWith(
        expect.objectContaining({ issue_number: 1, labels: ['a', 'b'] }),
      );
    });

    it('returns early when update has no fields', async () => {
      await client.updateIssue('org', 'repo', 1, {});
      expect(octokit.rest.issues.update).not.toHaveBeenCalled();
    });
  });

  // ── Retry Logic ─────────────────────────────────────────────
  describe('retry logic', () => {
    it('retries on 429 with exponential backoff', async () => {
      const error429 = { status: 429, message: 'rate limited' };
      octokit.rest.repos.get
        .mockRejectedValueOnce(error429)
        .mockRejectedValueOnce(error429)
        .mockResolvedValueOnce({ data: mockRepoData });

      const result = await client.getRepo('org', 'repo');
      expect(result.repo).toBe('test-repo');
      expect(octokit.rest.repos.get).toHaveBeenCalledTimes(3);
    });

    it('retries on 403 (secondary rate limit)', async () => {
      octokit.rest.repos.get
        .mockRejectedValueOnce({ status: 403 })
        .mockResolvedValueOnce({ data: mockRepoData });

      const result = await client.getRepo('org', 'repo');
      expect(result.repo).toBe('test-repo');
      expect(octokit.rest.repos.get).toHaveBeenCalledTimes(2);
    });

    it('retries on 5xx errors', async () => {
      octokit.rest.repos.get
        .mockRejectedValueOnce({ status: 502 })
        .mockResolvedValueOnce({ data: mockRepoData });

      const result = await client.getRepo('org', 'repo');
      expect(result.repo).toBe('test-repo');
      expect(octokit.rest.repos.get).toHaveBeenCalledTimes(2);
    });

    it('throws RateLimitError after max retries on 429', async () => {
      octokit.rest.repos.get.mockRejectedValue({ status: 429, message: 'rate limited' });
      await expect(client.getRepo('org', 'repo')).rejects.toThrow(RateLimitError);
    });

    it('throws GitHubApiError after max retries on server error', async () => {
      octokit.rest.repos.get.mockRejectedValue({ status: 500, message: 'server error' });
      await expect(client.getRepo('org', 'repo')).rejects.toThrow(GitHubApiError);
    });

    it('does not retry non-retryable client errors (400)', async () => {
      octokit.rest.repos.get.mockRejectedValue({ status: 400, message: 'bad request' });
      await expect(client.getRepo('org', 'repo')).rejects.toThrow(GitHubApiError);
      expect(octokit.rest.repos.get).toHaveBeenCalledTimes(1);
    });

    it('does not retry non-retryable client errors (422)', async () => {
      octokit.rest.repos.get.mockRejectedValue({ status: 422, message: 'unprocessable' });
      await expect(client.getRepo('org', 'repo')).rejects.toThrow(GitHubApiError);
      expect(octokit.rest.repos.get).toHaveBeenCalledTimes(1);
    });

    it('uses retry-after header for 429 delay', async () => {
      const errorWithRetryAfter = {
        status: 429,
        message: 'rate limited',
        response: { headers: { 'retry-after': '1' } },
      };
      octokit.rest.repos.get
        .mockRejectedValueOnce(errorWithRetryAfter)
        .mockResolvedValueOnce({ data: mockRepoData });

      // Mock sleep to avoid actual delay
      const sleepSpy = jest.spyOn(client as any, 'sleep').mockResolvedValue(undefined);

      await client.getRepo('org', 'repo');
      expect(sleepSpy).toHaveBeenCalledWith(1000); // retryAfter * 1000 = 1000
      sleepSpy.mockRestore();
    });

    it('uses x-ratelimit-reset header as fallback for retry-after', async () => {
      const futureTime = Math.floor(Date.now() / 1000) + 60; // 60 seconds from now
      const errorWithResetHeader = {
        status: 429,
        message: 'rate limited',
        response: { headers: { 'x-ratelimit-reset': String(futureTime) } },
      };
      octokit.rest.repos.get
        .mockRejectedValueOnce(errorWithResetHeader)
        .mockResolvedValueOnce({ data: mockRepoData });

      const sleepSpy = jest.spyOn(client as any, 'sleep').mockResolvedValue(undefined);
      await client.getRepo('org', 'repo');
      // retryAfter should be ~60 seconds
      expect(sleepSpy).toHaveBeenCalledWith(expect.any(Number));
      sleepSpy.mockRestore();
    });

    it('uses exponential backoff when no retry-after header on 403', async () => {
      octokit.rest.repos.get
        .mockRejectedValueOnce({ status: 403 })
        .mockResolvedValueOnce({ data: mockRepoData });

      const sleepSpy = jest.spyOn(client as any, 'sleep').mockResolvedValue(undefined);
      await client.getRepo('org', 'repo');
      expect(sleepSpy).toHaveBeenCalledWith(1000); // BASE_DELAY_MS * 2^0
      sleepSpy.mockRestore();
    });

    it('wraps 404 errors as NotFoundError', async () => {
      const error404 = { status: 404, message: 'Not Found' };
      octokit.rest.repos.get.mockRejectedValue(error404);
      await expect(client.getRepo('org', 'repo')).rejects.toThrow(NotFoundError);
      expect(octokit.rest.repos.get).toHaveBeenCalledTimes(1);
    });

    it('wraps unknown status as GitHubApiError with 500', async () => {
      octokit.rest.repos.get.mockRejectedValue({ message: 'something broke' });
      await expect(client.getRepo('org', 'repo')).rejects.toThrow(GitHubApiError);
    });
  });

  describe('branch coverage', () => {
    it('handles getBranchProtection with missing required_status_checks', async () => {
      octokit.rest.repos.getBranchProtection.mockResolvedValue({
        data: { enforce_admins: { enabled: true } },
      });
      const result = await client.getBranchProtection('org', 'repo', 'main');
      expect(result.requiredReviews).toBe(0);
      expect(result.requiredStatusChecks).toEqual([]);
      expect(result.enforceAdmins).toBe(true);
    });

    it('handles getBranchProtection with missing enforce_admins', async () => {
      octokit.rest.repos.getBranchProtection.mockResolvedValue({
        data: {
          required_pull_request_reviews: { required_approving_review_count: 2 },
          required_status_checks: { contexts: ['ci'] },
        },
      });
      const result = await client.getBranchProtection('org', 'repo', 'main');
      expect(result.enforceAdmins).toBe(false);
    });

    it('handles searchIssues with null labels', async () => {
      octokit.rest.search.issuesAndPullRequests.mockResolvedValue({
        data: {
          items: [{
            number: 1, title: 'issue', state: 'open',
            labels: null, updated_at: '2026-01-01T00:00:00Z', html_url: 'url',
          }],
        },
      });
      const result = await client.searchIssues('org', 'repo', 'is:open');
      expect(result[0].labels).toEqual([]);
    });
  });
});
