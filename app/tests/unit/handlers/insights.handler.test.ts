/**
 * Insights handler unit tests.
 */

import { jest, describe, it, beforeEach, expect } from '@jest/globals';
import { InsightsHandler } from '../../../src/handlers/insights.handler.js';
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

function createMockConfig(overrides: Record<string, unknown> = {}): jest.Mocked<IConfigProvider> {
  const defaults: Record<string, unknown> = {
    'insights.collectDoraMetrics': true,
    'insights.ciHealthThreshold': 0.9,
    ...overrides,
  };
  return {
    getConfig: jest.fn(),
    get: jest.fn((path: string, defaultValue: unknown) => defaults[path] ?? defaultValue),
    reload: jest.fn(),
  } as unknown as jest.Mocked<IConfigProvider>;
}

function createContext(overrides: Partial<EventContext> = {}): EventContext {
  return {
    name: 'check_run.completed',
    deliveryId: 'test-delivery',
    payload: {
      check_run: { id: 1, name: 'unit-tests', conclusion: 'success', head_sha: 'abc123' },
    },
    repo: { owner: 'test-org', repo: 'test-repo' },
    sender: 'github-actions[bot]',
    octokit: createMockOctokit(),
    ...overrides,
  };
}

describe('InsightsHandler', () => {
  let handler: InsightsHandler;
  let logger: ILogger;

  beforeEach(() => {
    logger = createMockLogger();
    handler = new InsightsHandler(logger, createMockConfig());
  });

  it('has correct metadata', () => {
    expect(handler.name).toBe('insights');
    expect(handler.events).toContain('check_run.completed');
    expect(handler.events).toContain('pull_request.closed');
  });

  it('returns NO_ACTION when collectDoraMetrics is disabled', async () => {
    const config = createMockConfig({ 'insights.collectDoraMetrics': false });
    handler = new InsightsHandler(logger, config);
    const context = createContext();
    const result = await handler.handle(context);
    expect(result.actionTaken).toBe(false);
  });

  it('returns NO_ACTION for unknown events', async () => {
    const context = createContext({ name: 'unknown.event' });
    const result = await handler.handle(context);
    expect(result.actionTaken).toBe(false);
  });

  describe('check_run.completed', () => {
    it('returns NO_ACTION when check_run is missing', async () => {
      const context = createContext({ name: 'check_run.completed', payload: {} });
      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(false);
    });

    it('records successful check run', async () => {
      const context = createContext({
        name: 'check_run.completed',
        payload: { check_run: { id: 10, name: 'lint', conclusion: 'success', head_sha: 'def456' } },
      });

      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(true);
      expect(result.summary).toContain('lint');
      expect(result.summary).toContain('success');
      expect(result.metadata).toMatchObject({ checkName: 'lint', conclusion: 'success' });
      expect(logger.info).toHaveBeenCalledWith(
        'CI check completed',
        expect.objectContaining({ checkName: 'lint', conclusion: 'success' }),
      );
    });

    it('logs warning for check run failure', async () => {
      const context = createContext({
        name: 'check_run.completed',
        payload: { check_run: { id: 11, name: 'integration-tests', conclusion: 'failure', head_sha: 'ghi789' } },
      });

      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(true);
      expect(result.summary).toContain('failure');
      expect(logger.warn).toHaveBeenCalledWith(
        'CI failure on test-org/test-repo',
        expect.objectContaining({ checkName: 'integration-tests', threshold: 0.9 }),
      );
    });

    it('does not log warning for non-failure conclusion', async () => {
      const context = createContext({
        name: 'check_run.completed',
        payload: { check_run: { id: 12, name: 'build', conclusion: 'skipped', head_sha: 'jkl012' } },
      });

      await handler.handle(context);
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('uses custom ciHealthThreshold from config', async () => {
      const config = createMockConfig({ 'insights.collectDoraMetrics': true, 'insights.ciHealthThreshold': 0.8 });
      handler = new InsightsHandler(logger, config);
      const context = createContext({
        name: 'check_run.completed',
        payload: { check_run: { id: 13, name: 'tests', conclusion: 'failure', head_sha: 'mno345' } },
      });

      await handler.handle(context);
      expect(logger.warn).toHaveBeenCalledWith(
        'CI failure on test-org/test-repo',
        expect.objectContaining({ threshold: 0.8 }),
      );
    });
  });

  describe('pull_request.closed', () => {
    it('returns NO_ACTION when PR is missing', async () => {
      const context = createContext({ name: 'pull_request.closed', payload: {} });
      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(false);
    });

    it('returns NO_ACTION when PR was not merged', async () => {
      const context = createContext({
        name: 'pull_request.closed',
        payload: { pull_request: { number: 50, merged: false, created_at: '2026-01-01T00:00:00Z' } },
      });
      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(false);
    });

    it('returns NO_ACTION when merged_at is missing', async () => {
      const context = createContext({
        name: 'pull_request.closed',
        payload: { pull_request: { number: 51, merged: true, created_at: '2026-01-01T00:00:00Z' } },
      });
      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(false);
    });

    it('returns NO_ACTION when created_at is missing', async () => {
      const context = createContext({
        name: 'pull_request.closed',
        payload: { pull_request: { number: 52, merged: true, merged_at: '2026-01-02T00:00:00Z' } },
      });
      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(false);
    });

    it('records lead time for merged PR', async () => {
      const context = createContext({
        name: 'pull_request.closed',
        payload: {
          pull_request: {
            number: 55,
            merged: true,
            created_at: '2026-01-01T00:00:00Z',
            merged_at: '2026-01-02T00:00:00Z',
          },
        },
      });

      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(true);
      expect(result.summary).toContain('55');
      expect(result.summary).toContain('lead time');
      expect(result.metadata).toMatchObject({ prNumber: 55 });
      expect(result.metadata!.leadTimeHours).toBe(24);
      expect(logger.info).toHaveBeenCalledWith(
        'PR merged — lead time recorded',
        expect.objectContaining({ prNumber: 55, leadTimeHours: 24 }),
      );
    });

    it('calculates fractional lead time correctly', async () => {
      const context = createContext({
        name: 'pull_request.closed',
        payload: {
          pull_request: {
            number: 56,
            merged: true,
            created_at: '2026-01-01T12:00:00Z',
            merged_at: '2026-01-01T18:30:00Z',
          },
        },
      });

      const result = await handler.handle(context);
      expect(result.metadata!.leadTimeHours).toBe(6.5);
    });
  });
});
