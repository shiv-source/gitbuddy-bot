/**
 * Sync handler unit tests.
 */

import { jest, describe, it, beforeEach, expect } from '@jest/globals';
import { SyncHandler } from '../../../src/handlers/sync.handler.js';
import type { ILogger, IGitHubClient, IConfigProvider } from '../../../src/core/interfaces.js';
import type { EventContext } from '../../../src/core/types.js';
import type { IntegrationConfig } from '../../../src/core/types.js';

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
  const defaults: Record<string, unknown> = { ...overrides };
  return {
    getConfig: jest.fn(),
    get: jest.fn((path: string, defaultValue: unknown) => defaults[path] ?? defaultValue),
    reload: jest.fn(),
  } as unknown as jest.Mocked<IConfigProvider>;
}

function createContext(overrides: Partial<EventContext> = {}): EventContext {
  return {
    name: 'workflow_run.completed',
    deliveryId: 'test-delivery',
    payload: {
      workflow_run: { id: 1, name: 'ci-build', conclusion: 'success', head_branch: 'main' },
    },
    repo: { owner: 'test-org', repo: 'test-repo' },
    sender: 'github-actions[bot]',
    octokit: createMockOctokit(),
    ...overrides,
  };
}

describe('SyncHandler', () => {
  let handler: SyncHandler;
  let logger: ILogger;

  beforeEach(() => {
    logger = createMockLogger();
    handler = new SyncHandler(logger, createMockConfig());
  });

  it('has correct metadata', () => {
    expect(handler.name).toBe('sync');
    expect(handler.events).toContain('workflow_run.completed');
    expect(handler.events).toContain('deployment_status');
  });

  it('returns NO_ACTION for unknown events', async () => {
    const context = createContext({ name: 'unknown.event' });
    const result = await handler.handle(context);
    expect(result.actionTaken).toBe(false);
  });

  describe('workflow_run.completed', () => {
    it('returns NO_ACTION when workflow_run is missing', async () => {
      const context = createContext({ name: 'workflow_run.completed', payload: {} });
      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(false);
    });

    it('returns NO_ACTION when conclusion is not success', async () => {
      const context = createContext({
        name: 'workflow_run.completed',
        payload: { workflow_run: { id: 2, name: 'ci-build', conclusion: 'failure', head_branch: 'main' } },
      });
      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(false);
    });

    it('returns NO_ACTION when no downstream repos configured', async () => {
      const context = createContext({ name: 'workflow_run.completed' });
      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(false);
    });

    it('returns NO_ACTION when downstream map has no entry for this repo', async () => {
      const config = createMockConfig({ 'sync.downstreamRepos': { 'other/repo': ['target/repo'] } });
      handler = new SyncHandler(logger, config);
      const context = createContext({ name: 'workflow_run.completed' });
      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(false);
    });

    it('dispatches workflow to configured downstream repos', async () => {
      const config = createMockConfig({
        'sync.downstreamRepos': { 'test-org/test-repo': ['downstream-org/downstream-repo'] },
      });
      handler = new SyncHandler(logger, config);
      const octokit = createMockOctokit();
      const context = createContext({
        name: 'workflow_run.completed',
        payload: { workflow_run: { id: 3, name: 'ci-build', conclusion: 'success', head_branch: 'main' } },
        octokit,
      });

      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(true);
      expect(result.metadata).toMatchObject({ workflow: 'ci-build', dispatched: ['downstream-org/downstream-repo'] });
      expect(octokit.dispatchWorkflow).toHaveBeenCalledWith(
        'downstream-org', 'downstream-repo', 'ci-build', 'main',
      );
    });

    it('dispatches to multiple downstream repos', async () => {
      const config = createMockConfig({
        'sync.downstreamRepos': { 'test-org/test-repo': ['org1/repo1', 'org2/repo2'] },
      });
      handler = new SyncHandler(logger, config);
      const octokit = createMockOctokit();
      const context = createContext({
        name: 'workflow_run.completed',
        payload: { workflow_run: { id: 4, name: 'deploy', conclusion: 'success', head_branch: 'main' } },
        octokit,
      });

      const result = await handler.handle(context);
      expect(result.metadata).toMatchObject({ dispatched: ['org1/repo1', 'org2/repo2'] });
      expect(octokit.dispatchWorkflow).toHaveBeenCalledTimes(2);
    });

    it('skips malformed repo entries (missing /)', async () => {
      const config = createMockConfig({
        'sync.downstreamRepos': { 'test-org/test-repo': ['invalid-repo'] },
      });
      handler = new SyncHandler(logger, config);
      const octokit = createMockOctokit();
      const context = createContext({
        name: 'workflow_run.completed',
        payload: { workflow_run: { id: 5, name: 'deploy', conclusion: 'success', head_branch: 'develop' } },
        octokit,
      });

      const result = await handler.handle(context);
      expect(result.metadata!.dispatched).toHaveLength(0);
      expect(octokit.dispatchWorkflow).not.toHaveBeenCalled();
    });
  });

  describe('deployment_status', () => {
    it('returns NO_ACTION when no integrations configured', async () => {
      const context = createContext({ name: 'deployment_status' });
      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(false);
    });

    it('returns NO_ACTION when integrations array is empty', async () => {
      const config = createMockConfig({ 'sync.integrations': [] });
      handler = new SyncHandler(logger, config);
      const context = createContext({ name: 'deployment_status' });
      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(false);
    });

    it('notifies enabled integrations', async () => {
      const integrations: IntegrationConfig[] = [
        { type: 'slack', enabled: true },
      ];
      const config = createMockConfig({ 'sync.integrations': integrations });
      handler = new SyncHandler(logger, config);
      const context = createContext({
        name: 'deployment_status',
        payload: { deployment: { id: 1, environment: 'production' }, deployment_status: { state: 'success' } },
      });

      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(true);
      expect(result.metadata).toMatchObject({ integrationCount: 1 });
      expect(logger.info).toHaveBeenCalledWith(
        'Notifying slack of deployment status',
        expect.objectContaining({ integration: 'slack', state: 'success' }),
      );
    });

    it('skips disabled integrations', async () => {
      const integrations: IntegrationConfig[] = [
        { type: 'slack', enabled: false },
        { type: 'teams', enabled: true },
      ];
      const logger2 = createMockLogger();
      const config = createMockConfig({ 'sync.integrations': integrations });
      handler = new SyncHandler(logger2, config);
      const context = createContext({ name: 'deployment_status' });

      const result = await handler.handle(context);
      expect(result.metadata).toMatchObject({ integrationCount: 2 });
      // Base handler logs "Handler completed" (1 info) + one enabled integration (1 info) = 2
      expect(logger2.info).toHaveBeenCalledWith(
        'Notifying teams of deployment status',
        expect.anything(),
      );
      // Verify slack was NOT notified (disabled)
      const slackCalls = (logger2.info as jest.Mock).mock.calls.filter(
        (call: unknown[]) => typeof call[0] === 'string' && (call[0] as string).includes('slack'),
      );
      expect(slackCalls).toHaveLength(0);
    });
  });
});
