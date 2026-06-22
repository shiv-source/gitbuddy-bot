/**
 * Governance handler unit tests.
 *
 * Uses manual mocks for ILogger, IConfigProvider, and IGitHubClient.
 * IGitHubClient is injected via context.octokit (per-event), not via constructor.
 * No Probot, no network. Pure logic test.
 */

import { jest, describe, it, beforeEach, expect } from '@jest/globals';
import { GovernanceHandler } from '../../../src/handlers/governance.handler.js';
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
    getBranchProtection: jest.fn().mockResolvedValue(null),
    updateBranchProtection: jest.fn(),
    getTeamMembers: jest.fn(),
    dispatchWorkflow: jest.fn(),
    createCheckRun: jest.fn(),
    searchRepos: jest.fn(),
    searchIssues: jest.fn(),
    updateIssue: jest.fn(),
  };
}

function createMocks() {
  const logger: ILogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const config: jest.Mocked<IConfigProvider> = {
    getConfig: jest.fn(),
    get: jest.fn((_path, defaultValue) => defaultValue),
    reload: jest.fn(),
  };

  return { logger, config };
}

function createContext(overrides: Partial<EventContext> = {}): EventContext {
  return {
    name: 'repository.created',
    deliveryId: 'test-1',
    payload: {},
    repo: { owner: 'test-org', repo: 'test-repo' },
    sender: 'test-user',
    octokit: createMockOctokit(),
    ...overrides,
  };
}

describe('GovernanceHandler', () => {
  let handler: GovernanceHandler;
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(() => {
    mocks = createMocks();
    handler = new GovernanceHandler(mocks.logger, mocks.config);
  });

  it('has the correct handler metadata', () => {
    expect(handler.name).toBe('governance');
    expect(handler.events).toContain('repository.created');
    expect(handler.events).toContain('branch_protection_rule.created');
    expect(handler.events).toContain('branch_protection_rule.edited');
  });

  it('returns NO_ACTION for unknown events', async () => {
    const context = createContext({ name: 'unknown.event' });

    const result = await handler.handle(context);
    expect(result.actionTaken).toBe(false);
  });

  it('bootstraps new repos matching the pattern', async () => {
    mocks.config.get.mockImplementation((path: string, defaultValue: unknown) => {
      if (path === 'governance.autoBootstrapPatterns') return ['service-.*'];
      if (path === 'governance.requiredStatusChecks') return ['lint'];
      if (path === 'governance.requiredReviewCount') return 1;
      return defaultValue;
    });

    const context = createContext({
      name: 'repository.created',
      repo: { owner: 'test-org', repo: 'service-api' },
      org: 'test-org',
    });

    const result = await handler.handle(context);
    expect(result.actionTaken).toBe(true);
    expect(context.octokit.updateBranchProtection).toHaveBeenCalledWith(
      'test-org',
      'service-api',
      'main',
      expect.objectContaining({
        requiredReviews: 1,
        requiredStatusChecks: ['lint'],
        enforceAdmins: true,
      }),
    );
  });

  it('skips bootstrapping repos that do not match the pattern', async () => {
    mocks.config.get.mockImplementation((path: string, defaultValue: unknown) => {
      if (path === 'governance.autoBootstrapPatterns') return ['service-.*'];
      return defaultValue;
    });

    const context = createContext({
      name: 'repository.created',
      repo: { owner: 'test-org', repo: 'random-repo' },
    });

    const result = await handler.handle(context);
    expect(result.actionTaken).toBe(false);
    expect(context.octokit.updateBranchProtection).not.toHaveBeenCalled();
  });

  it('skips bootstrapping when autoBootstrapPatterns is empty', async () => {
    mocks.config.get.mockImplementation((_path: string, defaultValue: unknown) => defaultValue);

    const context = createContext({
      name: 'repository.created',
      repo: { owner: 'test-org', repo: 'service-api' },
    });

    const result = await handler.handle(context);
    expect(result.actionTaken).toBe(false);
    expect(context.octokit.updateBranchProtection).not.toHaveBeenCalled();
  });

  it('throws ValidationError when payload is null', async () => {
    const context = createContext({ name: 'repository.created', payload: null as unknown as Record<string, unknown> });
    await expect(handler.handle(context)).rejects.toThrow('Governance event missing payload');
  });

  it('throws ValidationError when payload is undefined', async () => {
    const context = createContext({ name: 'repository.created', payload: undefined });
    await expect(handler.handle(context)).rejects.toThrow('Governance event missing payload');
  });

  describe('branch_protection_rule.created', () => {
    it('creates branch protection when none exists', async () => {
      mocks.config.get.mockImplementation((path: string, defaultValue: unknown) => {
        if (path === 'governance.requiredStatusChecks') return ['ci/build'];
        if (path === 'governance.requiredReviewCount') return 2;
        return defaultValue;
      });

      const octokit = createMockOctokit();
      octokit.getBranchProtection.mockResolvedValue(null);

      const context = createContext({
        name: 'branch_protection_rule.created',
        repo: { owner: 'test-org', repo: 'test-repo' },
        octokit,
      });

      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(true);
      expect(result.summary).toContain('Enforced branch protection');
      expect(octokit.updateBranchProtection).toHaveBeenCalledWith(
        'test-org', 'test-repo', 'main',
        expect.objectContaining({ requiredReviews: 2, requiredStatusChecks: ['ci/build'], enforceAdmins: true }),
      );
    });
  });

  describe('branch_protection_rule.edited', () => {
    it('corrects missing status checks', async () => {
      mocks.config.get.mockImplementation((path: string, defaultValue: unknown) => {
        if (path === 'governance.requiredStatusChecks') return ['ci/build', 'lint'];
        if (path === 'governance.requiredReviewCount') return 1;
        return defaultValue;
      });

      const octokit = createMockOctokit();
      octokit.getBranchProtection.mockResolvedValue({
        branch: 'main',
        requiredReviews: 1,
        requiredStatusChecks: ['ci/build'],
        enforceAdmins: true,
      });

      const context = createContext({
        name: 'branch_protection_rule.edited',
        repo: { owner: 'test-org', repo: 'test-repo' },
        octokit,
      });

      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(true);
      expect(result.summary).toContain('Corrected branch protection gaps');
      expect(result.metadata).toMatchObject({ missingChecks: ['lint'], requiredReviews: 1 });
    });

    it('corrects when review count is below requirement', async () => {
      mocks.config.get.mockImplementation((path: string, defaultValue: unknown) => {
        if (path === 'governance.requiredStatusChecks') return ['ci/build'];
        if (path === 'governance.requiredReviewCount') return 2;
        return defaultValue;
      });

      const octokit = createMockOctokit();
      octokit.getBranchProtection.mockResolvedValue({
        branch: 'main',
        requiredReviews: 1,
        requiredStatusChecks: ['ci/build'],
        enforceAdmins: true,
      });

      const context = createContext({
        name: 'branch_protection_rule.edited',
        repo: { owner: 'test-org', repo: 'test-repo' },
        octokit,
      });

      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(true);
      expect(result.summary).toContain('Corrected branch protection gaps');
    });

    it('returns NO_ACTION when protection already meets policy', async () => {
      mocks.config.get.mockImplementation((path: string, defaultValue: unknown) => {
        if (path === 'governance.requiredStatusChecks') return ['ci/build'];
        if (path === 'governance.requiredReviewCount') return 1;
        return defaultValue;
      });

      const octokit = createMockOctokit();
      octokit.getBranchProtection.mockResolvedValue({
        branch: 'main',
        requiredReviews: 1,
        requiredStatusChecks: ['ci/build'],
        enforceAdmins: true,
      });

      const context = createContext({
        name: 'branch_protection_rule.edited',
        repo: { owner: 'test-org', repo: 'test-repo' },
        octokit,
      });

      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(false);
    });
  });
});
