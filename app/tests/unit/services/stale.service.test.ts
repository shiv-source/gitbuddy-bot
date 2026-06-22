/**
 * StaleService unit tests.
 *
 * Uses manual mocks for IGitHubClient, IConfigProvider, and ILogger.
 * No Probot, no network, no framework. Pure business logic test.
 */

import { jest, describe, it, beforeEach, expect } from '@jest/globals';
import { StaleService } from '../../../src/services/stale.service.js';
import type {
  IGitHubClient,
  IConfigProvider,
  ILogger,
  IssueSearchResult,
} from '../../../src/core/interfaces.js';

function createMockOctokit(): jest.Mocked<IGitHubClient> {
  return {
    getRepo: jest.fn(),
    createIssueComment: jest.fn(),
    addLabels: jest.fn(),
    removeLabel: jest.fn(),
    getPullRequest: jest.fn(),
    requestReviewers: jest.fn(),
    createPRComment: jest.fn(),
    getBranchProtection: jest.fn(),
    updateBranchProtection: jest.fn(),
    getTeamMembers: jest.fn(),
    dispatchWorkflow: jest.fn(),
    createCheckRun: jest.fn(),
    searchRepos: jest.fn(),
    searchIssues: jest.fn(),
    updateIssue: jest.fn(),
  };
}

function createOldDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

function createMockLogger(): ILogger {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

function createMockConfig(overrides: Record<string, unknown> = {}): jest.Mocked<IConfigProvider> {
  const defaults: Record<string, unknown> = {
    'automation.staleLabel': 'stale',
    'automation.staleAfterDays': 60,
    'automation.closeAfterDays': 7,
    ...overrides,
  };

  return {
    getConfig: jest.fn(),
    get: jest.fn((path: string, defaultValue: unknown) => {
      if (path in defaults) return defaults[path];
      return defaultValue;
    }),
    reload: jest.fn(),
  } as unknown as jest.Mocked<IConfigProvider>;
}

function makeIssue(overrides: Partial<IssueSearchResult> = {}): IssueSearchResult {
  return {
    number: 42,
    title: 'Test issue',
    state: 'open',
    labels: [],
    updatedAt: new Date().toISOString(),
    url: 'https://github.com/test-org/test-repo/issues/42',
    ...overrides,
  };
}

describe('StaleService', () => {
  let service: StaleService;
  let logger: ILogger;

  beforeEach(() => {
    logger = createMockLogger();
    service = new StaleService(logger);
  });

  // ── sweepRepo ──────────────────────────────────────────────

  describe('sweepRepo', () => {
    it('marks issues as stale when they have no activity past the threshold', async () => {
      const octokit = createMockOctokit();
      const config = createMockConfig({
        'automation.staleAfterDays': 60,
        'automation.closeAfterDays': 7,
        'automation.staleLabel': 'stale',
      });

      // Phase 1: one candidate (old, no stale label)
      const candidate = makeIssue({
        number: 1,
        labels: [],
        updatedAt: createOldDate(90), // 90 days old → past 60-day threshold
      });

      octokit.searchIssues.mockResolvedValueOnce([candidate]); // Phase 1 query
      octokit.searchIssues.mockResolvedValueOnce([]);          // Phase 2 query (empty)

      const result = await service.sweepRepo(octokit, 'test-org', 'test-repo', config);

      expect(result.markedStale).toBe(1);
      expect(result.closed).toBe(0);

      expect(octokit.updateIssue).toHaveBeenCalledWith(
        'test-org',
        'test-repo',
        1,
        { labels: ['stale'] },
      );

      expect(octokit.createIssueComment).toHaveBeenCalledWith(
        'test-org',
        'test-repo',
        1,
        expect.stringContaining('stale'),
      );
    });

    it('skips issues that have recent activity (no stale candidates)', async () => {
      const octokit = createMockOctokit();
      const config = createMockConfig({ 'automation.staleAfterDays': 60 });

      octokit.searchIssues.mockResolvedValueOnce([]); // Phase 1: no old issues
      octokit.searchIssues.mockResolvedValueOnce([]); // Phase 2: no stale issues

      const result = await service.sweepRepo(octokit, 'test-org', 'test-repo', config);

      expect(result.markedStale).toBe(0);
      expect(result.closed).toBe(0);
      expect(octokit.updateIssue).not.toHaveBeenCalled();
    });

    it('closes stale issues that are past the close threshold', async () => {
      const octokit = createMockOctokit();
      const config = createMockConfig({
        'automation.staleAfterDays': 60,
        'automation.closeAfterDays': 7,
      });

      // Phase 1: no new candidates
      octokit.searchIssues.mockResolvedValueOnce([]);

      // Phase 2: one stale issue, no activity in 30 days (past 7-day close threshold)
      const staleIssue = makeIssue({
        number: 2,
        labels: ['stale'],
        updatedAt: createOldDate(30), // 30 days since last update
      });
      octokit.searchIssues.mockResolvedValueOnce([staleIssue]);

      const result = await service.sweepRepo(octokit, 'test-org', 'test-repo', config);

      expect(result.closed).toBe(1);
      expect(octokit.updateIssue).toHaveBeenCalledWith(
        'test-org',
        'test-repo',
        2,
        { state: 'closed' },
      );
      expect(octokit.createIssueComment).toHaveBeenCalledWith(
        'test-org',
        'test-repo',
        2,
        expect.stringContaining('closed'),
      );
    });

    it('leaves stale issues alone when not yet past the close threshold', async () => {
      const octokit = createMockOctokit();
      const config = createMockConfig({
        'automation.staleAfterDays': 60,
        'automation.closeAfterDays': 7,
      });

      // Phase 1: no candidates
      octokit.searchIssues.mockResolvedValueOnce([]);

      // Phase 2: stale issue updated 3 days ago — still within the 7-day close window
      const waitingIssue = makeIssue({
        number: 4,
        labels: ['stale'],
        updatedAt: createOldDate(3), // 3 days ago, close threshold is 7
      });
      octokit.searchIssues.mockResolvedValueOnce([waitingIssue]);

      const result = await service.sweepRepo(octokit, 'test-org', 'test-repo', config);

      // No action — not old enough to close yet
      expect(result.closed).toBe(0);
      expect(result.markedStale).toBe(0);
      expect(octokit.updateIssue).not.toHaveBeenCalled();
    });

    it('resets the close clock when activity occurs on a stale issue', async () => {
      const octokit = createMockOctokit();
      const config = createMockConfig({
        'automation.staleAfterDays': 60,
        'automation.closeAfterDays': 7,
      });

      // Phase 1: no candidates
      octokit.searchIssues.mockResolvedValueOnce([]);

      // Phase 2: stale issue with very recent activity (someone commented)
      const activeStaleIssue = makeIssue({
        number: 5,
        labels: ['stale', 'bug'],
        updatedAt: new Date().toISOString(), // just now — activity happened
      });
      octokit.searchIssues.mockResolvedValueOnce([activeStaleIssue]);

      const result = await service.sweepRepo(octokit, 'test-org', 'test-repo', config);

      // Not closed because updated_at is recent (clock reset)
      expect(result.closed).toBe(0);
      expect(result.markedStale).toBe(0);
      expect(octokit.updateIssue).not.toHaveBeenCalled();
    });

    it('handles API errors gracefully per issue', async () => {
      const octokit = createMockOctokit();
      const config = createMockConfig();

      const issue1 = makeIssue({ number: 10, labels: [], updatedAt: createOldDate(90) });
      const issue2 = makeIssue({ number: 11, labels: [], updatedAt: createOldDate(90) });

      octokit.searchIssues.mockResolvedValueOnce([issue1, issue2]); // Phase 1
      octokit.searchIssues.mockResolvedValueOnce([]);              // Phase 2 empty

      // First succeeds, second fails
      octokit.updateIssue
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('API failure'));

      const result = await service.sweepRepo(octokit, 'test-org', 'test-repo', config);

      expect(result.markedStale).toBe(1);
      expect(result.errors).toBe(1);
    });

    it('handles both mark and close in a single sweep', async () => {
      const octokit = createMockOctokit();
      const config = createMockConfig({
        'automation.staleAfterDays': 60,
        'automation.closeAfterDays': 7,
      });

      // Phase 1: one issue to mark stale
      const candidate = makeIssue({
        number: 100,
        labels: [],
        updatedAt: createOldDate(90),
      });

      // Phase 2: one stale issue to close
      const toClose = makeIssue({
        number: 200,
        labels: ['stale'],
        updatedAt: createOldDate(30),
      });

      octokit.searchIssues.mockResolvedValueOnce([candidate]);
      octokit.searchIssues.mockResolvedValueOnce([toClose]);

      const result = await service.sweepRepo(octokit, 'test-org', 'test-repo', config);

      expect(result.markedStale).toBe(1);
      expect(result.closed).toBe(1);
      expect(octokit.updateIssue).toHaveBeenCalledTimes(2);
    });
  });

  // ── sweepOrg ───────────────────────────────────────────────

  describe('sweepOrg', () => {
    it('sweeps all non-archived repos in an org', async () => {
      const octokit = createMockOctokit();
      const config = createMockConfig();

      octokit.searchRepos.mockResolvedValue([
        { owner: 'test-org', repo: 'repo-a', defaultBranch: 'main', isPrivate: false, archived: false },
        { owner: 'test-org', repo: 'repo-b', defaultBranch: 'main', isPrivate: true, archived: false },
        { owner: 'test-org', repo: 'archived-repo', defaultBranch: 'main', isPrivate: false, archived: true },
      ]);

      // Each active repo: 2 searchIssues calls (Phase 1 + Phase 2), all empty
      for (let i = 0; i < 4; i++) {
        octokit.searchIssues.mockResolvedValueOnce([]);
      }

      const result = await service.sweepOrg(octokit, 'test-org', config);

      expect(result.reposSwept).toBe(2); // archived repo skipped
      expect(result.markedStale).toBe(0);
    });
  });

  // ── Error handling ──────────────────────────────────────────
  describe('error handling during sweep', () => {
    let service: StaleService;
    let logger: ILogger;
    let config: jest.Mocked<IConfigProvider>;
    let octokit: jest.Mocked<IGitHubClient>;

    beforeEach(() => {
      logger = createMockLogger();
      config = createMockConfig();
      octokit = createMockOctokit();
      service = new StaleService(logger);
    });

    it('handles per-issue error during Phase 1 (mark)', async () => {
      octokit.searchIssues
        .mockResolvedValueOnce([makeIssue(1, 'Phase 1 issue', [], 200)]) // Phase 1
        .mockResolvedValueOnce([]); // Phase 2 — empty

      // updateIssue throws for the first issue
      octokit.updateIssue.mockRejectedValueOnce(new Error('API error'));

      const result = await service.sweepRepo(octokit, 'test-org', 'test-repo', config);

      expect(result.errors).toBe(1);
      expect(result.markedStale).toBe(0);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to mark'),
        expect.any(Error),
        expect.any(Object),
      );
    });

    it('handles per-issue error during Phase 2 (close)', async () => {
      // Set stale and close thresholds so the issue qualifies for closing
      config.get.mockImplementation((path: string, defaultValue: unknown) => {
        if (path === 'automation.staleLabel') return 'stale';
        if (path === 'automation.staleAfterDays') return 90;
        if (path === 'automation.closeAfterDays') return 1;
        return defaultValue;
      });

      // Phase 1: empty, Phase 2: one stale issue 10 days old (past 1-day close cutoff)
      const issue = makeIssue(2, 'Already stale', ['stale'], 10);
      octokit.searchIssues
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([issue]);

      // updateIssue throws for the close attempt
      octokit.updateIssue.mockRejectedValue(new Error('API error'));

      const result = await service.sweepRepo(octokit, 'test-org', 'test-repo', config);

      expect(result.errors).toBeGreaterThanOrEqual(0);
      expect(result.closed).toBe(0);
    });
  });
});
