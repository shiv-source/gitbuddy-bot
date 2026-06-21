/**
 * Stale handler unit tests.
 *
 * Tests that the handler correctly triggers on matching workflow_run events
 * and delegates to StaleService.sweepRepo / sweepOrg.
 */

import { jest, describe, it, beforeEach, expect } from '@jest/globals';
import { StaleHandler } from '../../../src/handlers/stale.handler.js';
import type { ILogger, IGitHubClient, IConfigProvider } from '../../../src/core/interfaces.js';
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

  beforeEach(() => {
    logger = createMockLogger();
    handler = new StaleHandler(logger, createMockConfig());
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
    // StaleHandler calls sweepOrg when triggered from .github repo
    octokit.searchRepos.mockResolvedValue([]);

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

    // Mock searchIssues: 2 calls from sweepOrg → sweepRepo (but no repos to sweep)
    // searchRepos returns empty, so no sweepRepo calls

    const result = await handler.handle(context);
    expect(result.actionTaken).toBe(false); // no repos to sweep
  });

  it('triggers on workflow named "Mark Stale" (case-insensitive match)', async () => {
    const octokit = createMockOctokit();
    octokit.searchRepos.mockResolvedValue([]);

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
    // searchRepos should have been called (sweepOrg was triggered)
    expect(octokit.searchRepos).toHaveBeenCalled();
    // Even with 0 repos, no action was taken
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

    // Non-.github repo: handler calls sweepRepo (not sweepOrg)
    // sweepRepo makes 2 searchIssues calls, return empty
    octokit.searchIssues.mockResolvedValueOnce([]); // Phase 1
    octokit.searchIssues.mockResolvedValueOnce([]); // Phase 2

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
    // Should have called sweepRepo, not sweepOrg → no searchRepos call
    expect(octokit.searchRepos).not.toHaveBeenCalled();
    // Should have made the two phase queries for the repo
    expect(octokit.searchIssues).toHaveBeenCalledTimes(2);
  });
});
