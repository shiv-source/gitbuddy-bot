/**
 * Stale handler unit tests.
 *
 * Tests that the handler correctly triggers on matching workflow_run events
 * and delegates to StaleService.sweepRepo / sweepOrg.
 */

import { jest, describe, it, beforeEach, expect } from '@jest/globals';
import { StaleHandler } from '../../../src/handlers/stale.handler.js';
import type { ILogger, IGitHubClient, IConfigProvider, IStaleService, StaleSweepResult } from '../../../src/core/interfaces.js';
import type { EventContext } from '../../../src/core/types.js';

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

function createMockLogger(): ILogger {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

function createMockConfig(): jest.Mocked<IConfigProvider> {
  return {
    getConfig: jest.fn(),
    get: jest.fn((_path: string, defaultValue: unknown) => defaultValue),
    reload: jest.fn(),
  } as unknown as jest.Mocked<IConfigProvider>;
}

function createMockStaleService(): jest.Mocked<IStaleService> {
  return {
    sweepRepo: jest.fn<(...args: unknown[]) => Promise<StaleSweepResult>>().mockResolvedValue({
      markedStale: 0,
      closed: 0,
      reposSwept: 0,
      errors: 0,
    }),
    sweepOrg: jest.fn<(...args: unknown[]) => Promise<StaleSweepResult>>().mockResolvedValue({
      markedStale: 0,
      closed: 0,
      reposSwept: 0,
      errors: 0,
    }),
  };
}

function createContext(overrides: Partial<EventContext> = {}): EventContext {
  return {
    name: 'workflow_run.completed',
    deliveryId: 'test-delivery',
    payload: {
      workflow_run: {
        id: 123,
        name: 'stale-sweep',
        conclusion: 'success',
        head_branch: 'main',
      },
    },
    repo: { owner: 'test-org', repo: '.github' },
    org: 'test-org',
    sender: 'github-actions[bot]',
    octokit: createMockOctokit(),
    ...overrides,
  };
}

describe('StaleHandler', () => {
  let handler: StaleHandler;
  let logger: ILogger;
  let staleService: jest.Mocked<IStaleService>;

  beforeEach(() => {
    logger = createMockLogger();
    staleService = createMockStaleService();
    handler = new StaleHandler(logger, createMockConfig(), staleService);
  });

  it('has the correct handler metadata', () => {
    expect(handler.name).toBe('stale');
    expect(handler.events).toContain('workflow_run.completed');
  });

  it('returns NO_ACTION for unknown events', async () => {
    const context = createContext({ name: 'unknown.event' });
    const result = await handler.handle(context);
    expect(result.actionTaken).toBe(false);
  });

  it('triggers on workflow_run.completed with matching name "stale-sweep"', async () => {
    const octokit = createMockOctokit();

    const context = createContext({
      name: 'workflow_run.completed',
      payload: {
        workflow_run: {
          id: 456,
          name: 'stale-sweep',
          conclusion: 'success',
          head_branch: 'main',
        },
      },
      octokit,
    });

    const result = await handler.handle(context);
    // Handler delegates to staleService.sweepOrg when triggered from .github repo
    expect(staleService.sweepOrg).toHaveBeenCalledWith(
      context.octokit,
      'test-org',
      expect.anything(),
    );
    expect(result.actionTaken).toBe(false); // mock returns empty results
  });

  it('triggers on workflow named "Mark Stale" (case-insensitive match)', async () => {
    const octokit = createMockOctokit();

    const context = createContext({
      payload: {
        workflow_run: {
          id: 789,
          name: 'Mark Stale Issues',
          conclusion: 'success',
          head_branch: 'main',
        },
      },
      octokit,
    });

    const result = await handler.handle(context);
    // sweepOrg should have been called (triggered from .github repo)
    expect(staleService.sweepOrg).toHaveBeenCalledWith(
      context.octokit,
      'test-org',
      expect.anything(),
    );
    // Even with 0 repos in mock result, no action was taken
    expect(result.actionTaken).toBe(false);
  });

  it('ignores workflow runs that do not match stale patterns', async () => {
    const octokit = createMockOctokit();

    const context = createContext({
      payload: {
        workflow_run: {
          id: 999,
          name: 'CI Build',
          conclusion: 'success',
          head_branch: 'main',
        },
      },
      octokit,
    });

    const result = await handler.handle(context);
    expect(result.actionTaken).toBe(false);
    expect(octokit.searchRepos).not.toHaveBeenCalled();
  });

  it('ignores workflow runs with non-success conclusions', async () => {
    const octokit = createMockOctokit();

    const context = createContext({
      payload: {
        workflow_run: {
          id: 111,
          name: 'stale-sweep',
          conclusion: 'failure',
          head_branch: 'main',
        },
      },
      octokit,
    });

    const result = await handler.handle(context);
    expect(result.actionTaken).toBe(false);
    expect(octokit.searchRepos).not.toHaveBeenCalled();
  });

  it('sweeps only the specific repo when triggered from a non-.github repo', async () => {
    const octokit = createMockOctokit();

    const context = createContext({
      repo: { owner: 'test-org', repo: 'service-api' },
      payload: {
        workflow_run: {
          id: 222,
          name: 'stale-sweep',
          conclusion: 'success',
          head_branch: 'main',
        },
      },
      octokit,
    });

    const result = await handler.handle(context);
    // Should have called sweepRepo (not sweepOrg) for non-.github repo
    expect(staleService.sweepOrg).not.toHaveBeenCalled();
    expect(staleService.sweepRepo).toHaveBeenCalledWith(
      context.octokit,
      'test-org',
      'service-api',
      expect.anything(),
    );
  });

  it('reports actions taken when stale service marks issues', async () => {
    staleService.sweepOrg.mockResolvedValue({
      markedStale: 3, closed: 2, reposSwept: 5, errors: 1,
    });

    const context = createContext({
      repo: { owner: 'test-org', repo: '.github' },
      payload: {
        workflow_run: { id: 333, name: 'stale-sweep', conclusion: 'success', head_branch: 'main' },
      },
      octokit: createMockOctokit(),
    });

    const result = await handler.handle(context);
    expect(result.actionTaken).toBe(true);
    expect(result.summary).toContain('3 marked stale');
    expect(result.summary).toContain('2 closed');
    expect(result.summary).toContain('1 errors');
  });

  it('reports no actions needed when sweep returns zero results', async () => {
    staleService.sweepRepo.mockResolvedValue({
      markedStale: 0, closed: 0, reposSwept: 1, errors: 0,
    });

    const context = createContext({
      repo: { owner: 'test-org', repo: 'service-api' },
      payload: {
        workflow_run: { id: 444, name: 'stale-sweep', conclusion: 'success', head_branch: 'main' },
      },
      octokit: createMockOctokit(),
    });

    const result = await handler.handle(context);
    expect(result.summary).toContain('no actions needed');
  });

  it('falls back to owner when context.org is undefined', async () => {
    staleService.sweepRepo.mockResolvedValue({
      markedStale: 0, closed: 0, reposSwept: 1, errors: 0,
    });

    const context = createContext({
      repo: { owner: 'test-org', repo: 'service-api' },
      org: undefined,
      payload: {
        workflow_run: { id: 555, name: 'stale-sweep', conclusion: 'success', head_branch: 'main' },
      },
      octokit: createMockOctokit(),
    });

    const result = await handler.handle(context);
    expect(staleService.sweepRepo).toHaveBeenCalledWith(
      context.octokit, 'test-org', 'service-api', expect.anything(),
    );
  });
});
