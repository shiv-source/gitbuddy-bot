/**
 * Security handler unit tests.
 */

import { jest, describe, it, beforeEach, expect } from '@jest/globals';
import { SecurityHandler } from '../../../src/handlers/security.handler.js';
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
  const defaults: Record<string, unknown> = { ...overrides };
  return {
    getConfig: jest.fn(),
    get: jest.fn((path: string, defaultValue: unknown) => defaults[path] ?? defaultValue),
    reload: jest.fn(),
  } as unknown as jest.Mocked<IConfigProvider>;
}

function createContext(overrides: Partial<EventContext> = {}): EventContext {
  return {
    name: 'secret_scanning_alert.created',
    deliveryId: 'test-delivery',
    payload: {
      alert: { number: 1, secret_type: 'github_token' },
    },
    repo: { owner: 'test-org', repo: 'test-repo' },
    sender: 'github',
    octokit: createMockOctokit(),
    ...overrides,
  };
}

describe('SecurityHandler', () => {
  let handler: SecurityHandler;
  let logger: ILogger;

  beforeEach(() => {
    logger = createMockLogger();
    handler = new SecurityHandler(logger, createMockConfig());
  });

  it('has correct metadata', () => {
    expect(handler.name).toBe('security');
    expect(handler.events).toContain('secret_scanning_alert.created');
    expect(handler.events).toContain('push');
  });

  it('returns NO_ACTION for unknown events', async () => {
    const context = createContext({ name: 'unknown.event' });
    const result = await handler.handle(context);
    expect(result.actionTaken).toBe(false);
  });

  describe('secret_scanning_alert.created', () => {
    it('returns NO_ACTION when alert is missing from payload', async () => {
      const context = createContext({ name: 'secret_scanning_alert.created', payload: {} });
      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(false);
    });

    it('returns NO_ACTION when secret_type matches exclude pattern', async () => {
      const config = createMockConfig({ 'security.excludePatterns': ['github_token'] });
      handler = new SecurityHandler(logger, config);
      const context = createContext({ name: 'secret_scanning_alert.created' });
      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(false);
    });

    it('logs warning and returns result for valid alert', async () => {
      const config = createMockConfig({ 'security.alertChannel': '#security-alerts' });
      handler = new SecurityHandler(logger, config);
      const context = createContext({
        name: 'secret_scanning_alert.created',
        payload: { alert: { number: 42, secret_type: 'aws_access_key' } },
      });

      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(true);
      expect(result.metadata).toMatchObject({ alertNumber: 42, secretType: 'aws_access_key' });
      expect(logger.warn).toHaveBeenCalledWith(
        'Secret scanning alert #42',
        expect.objectContaining({ secretType: 'aws_access_key', alertChannel: '#security-alerts' }),
      );
    });

    it('uses empty alertChannel when not configured', async () => {
      handler = new SecurityHandler(logger, createMockConfig());
      const context = createContext({
        name: 'secret_scanning_alert.created',
        payload: { alert: { number: 1, secret_type: 'ssh_key' } },
      });

      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(true);
      expect(logger.warn).toHaveBeenCalledWith(
        'Secret scanning alert #1',
        expect.objectContaining({ alertChannel: '' }),
      );
    });
  });

  describe('push', () => {
    it('returns NO_ACTION when no commits', async () => {
      const context = createContext({ name: 'push', payload: { ref: 'refs/heads/main', commits: [] } });
      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(false);
    });

    it('returns NO_ACTION when commits is undefined', async () => {
      const context = createContext({ name: 'push', payload: { ref: 'refs/heads/main' } });
      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(false);
    });

    it('logs debug for push with commits', async () => {
      const context = createContext({
        name: 'push',
        payload: { ref: 'refs/heads/main', commits: [{ id: 'abc123', message: 'fix bug' }] },
      });

      const result = await handler.handle(context);
      // Always returns NO_ACTION for push events currently
      expect(result.actionTaken).toBe(false);
      expect(logger.debug).toHaveBeenCalledWith(
        'Push with 1 commits',
        expect.objectContaining({ commitCount: 1 }),
      );
    });

    it('logs debug with ref info', async () => {
      const context = createContext({
        name: 'push',
        payload: { ref: 'refs/heads/feature', commits: [{ id: 'def456', message: 'add feature' }, { id: 'ghi789', message: 'fix' }] },
      });

      await handler.handle(context);
      expect(logger.debug).toHaveBeenCalledWith(
        'Push with 2 commits',
        expect.objectContaining({ ref: 'refs/heads/feature', commitCount: 2 }),
      );
    });
  });
});
