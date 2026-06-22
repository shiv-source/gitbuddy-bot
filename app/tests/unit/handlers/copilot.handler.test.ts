/**
 * Copilot handler unit tests.
 */

import { jest, describe, it, beforeEach, expect } from '@jest/globals';
import { CopilotHandler } from '../../../src/handlers/copilot.handler.js';
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
    'copilot.prReviewEnabled': false,
    'copilot.prDescriptionEnabled': false,
    'copilot.maxTokens': 4096,
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
    name: 'pull_request.opened',
    deliveryId: 'test-delivery',
    payload: {
      action: 'opened',
      pull_request: { number: 42, title: 'feat: add thing', body: null, user: { login: 'dev1' } },
    },
    repo: { owner: 'test-org', repo: 'test-repo' },
    org: 'test-org',
    sender: 'dev1',
    octokit: createMockOctokit(),
    ...overrides,
  };
}

describe('CopilotHandler', () => {
  let handler: CopilotHandler;

  beforeEach(() => {
    handler = new CopilotHandler(createMockLogger(), createMockConfig());
  });

  it('has correct metadata', () => {
    expect(handler.name).toBe('copilot');
    expect(handler.events).toContain('pull_request.opened');
    expect(handler.events).toContain('issue_comment.created');
  });

  it('returns NO_ACTION when copilot features are disabled', async () => {
    const context = createContext({ name: 'pull_request.opened' });
    const result = await handler.handle(context);
    expect(result.actionTaken).toBe(false);
  });

  it('returns NO_ACTION for unknown events', async () => {
    const config = createMockConfig({ 'copilot.prReviewEnabled': true });
    handler = new CopilotHandler(createMockLogger(), config);
    const context = createContext({ name: 'unknown.event' });
    const result = await handler.handle(context);
    expect(result.actionTaken).toBe(false);
  });

  describe('pull_request.opened', () => {
    it('returns NO_ACTION when prDescriptionEnabled is false', async () => {
      const config = createMockConfig({ 'copilot.prReviewEnabled': true, 'copilot.prDescriptionEnabled': false });
      handler = new CopilotHandler(createMockLogger(), config);
      const context = createContext({ name: 'pull_request.opened' });
      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(false);
    });

    it('returns NO_ACTION when payload.pull_request is missing', async () => {
      const config = createMockConfig({ 'copilot.prDescriptionEnabled': true });
      handler = new CopilotHandler(createMockLogger(), config);
      const context = createContext({ name: 'pull_request.opened', payload: {} });
      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(false);
    });

    it('posts placeholder comment when PR has no body', async () => {
      const config = createMockConfig({
        'copilot.prReviewEnabled': true,
        'copilot.prDescriptionEnabled': true,
        'copilot.maxTokens': 2048,
      });
      handler = new CopilotHandler(createMockLogger(), config);
      const octokit = createMockOctokit();
      const context = createContext({
        name: 'pull_request.opened',
        payload: { pull_request: { number: 10, title: 'fix', body: null, user: { login: 'dev' } } },
        octokit,
      });

      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(true);
      expect(result.metadata).toMatchObject({ prNumber: 10, maxTokens: 2048 });
      expect(octokit.createPRComment).toHaveBeenCalledWith('test-org', 'test-repo', 10, expect.stringContaining('2048'));
    });

    it('posts placeholder comment when PR body is empty string', async () => {
      const config = createMockConfig({ 'copilot.prDescriptionEnabled': true });
      handler = new CopilotHandler(createMockLogger(), config);
      const octokit = createMockOctokit();
      const context = createContext({
        name: 'pull_request.opened',
        payload: { pull_request: { number: 11, title: 'fix', body: '', user: { login: 'dev' } } },
        octokit,
      });

      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(true);
      expect(octokit.createPRComment).toHaveBeenCalled();
    });

    it('returns NO_ACTION when PR already has a body', async () => {
      const config = createMockConfig({ 'copilot.prDescriptionEnabled': true });
      handler = new CopilotHandler(createMockLogger(), config);
      const octokit = createMockOctokit();
      const context = createContext({
        name: 'pull_request.opened',
        payload: { pull_request: { number: 12, title: 'fix', body: 'Existing description', user: { login: 'dev' } } },
        octokit,
      });

      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(false);
      expect(octokit.createPRComment).not.toHaveBeenCalled();
    });
  });

  describe('issue_comment.created', () => {
    it('returns NO_ACTION when no comment in payload', async () => {
      const config = createMockConfig({ 'copilot.prReviewEnabled': true });
      handler = new CopilotHandler(createMockLogger(), config);
      const context = createContext({ name: 'issue_comment.created', payload: {} });
      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(false);
    });

    it('returns NO_ACTION when comment does not mention @gitbuddy', async () => {
      const config = createMockConfig({ 'copilot.prReviewEnabled': true });
      handler = new CopilotHandler(createMockLogger(), config);
      const context = createContext({
        name: 'issue_comment.created',
        payload: { comment: { id: 1, body: 'just a regular comment', user: { login: 'dev' } } },
      });
      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(false);
    });

    it('returns NO_ACTION when @gitbuddy mentioned but prReviewEnabled is false', async () => {
      const config = createMockConfig({ 'copilot.prReviewEnabled': false });
      handler = new CopilotHandler(createMockLogger(), config);
      const context = createContext({
        name: 'issue_comment.created',
        payload: { comment: { id: 1, body: '@gitbuddy review this please', user: { login: 'dev' } } },
      });
      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(false);
    });

    it('responds to @gitbuddy mention on a PR', async () => {
      const config = createMockConfig({ 'copilot.prReviewEnabled': true });
      handler = new CopilotHandler(createMockLogger(), config);
      const octokit = createMockOctokit();
      const context = createContext({
        name: 'issue_comment.created',
        payload: {
          comment: { id: 5, body: '@gitbuddy review', user: { login: 'reviewer' } },
          issue: { number: 99, pull_request: {} },
        },
        octokit,
      });

      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(true);
      expect(result.metadata).toMatchObject({ issueNumber: 99, isPR: true });
      expect(octokit.createIssueComment).toHaveBeenCalledWith(
        'test-org', 'test-repo', 99, expect.stringContaining('AI code review coming soon'),
      );
    });

    it('responds to @gitbuddy mention on an issue (not PR)', async () => {
      const config = createMockConfig({ 'copilot.prReviewEnabled': true });
      handler = new CopilotHandler(createMockLogger(), config);
      const octokit = createMockOctokit();
      const context = createContext({
        name: 'issue_comment.created',
        payload: {
          comment: { id: 6, body: '@gitbuddy help', user: { login: 'user' } },
          issue: { number: 100 },
        },
        octokit,
      });

      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(true);
      expect(result.metadata).toMatchObject({ issueNumber: 100, isPR: false });
      // No createIssueComment for non-PR mentions
      expect(octokit.createIssueComment).not.toHaveBeenCalled();
    });

    it('matches @gitbuddy case-insensitively', async () => {
      const config = createMockConfig({ 'copilot.prReviewEnabled': true });
      handler = new CopilotHandler(createMockLogger(), config);
      const context = createContext({
        name: 'issue_comment.created',
        payload: {
          comment: { id: 7, body: '@GitBuddy review', user: { login: 'dev' } },
          issue: { number: 101, pull_request: {} },
        },
        octokit: createMockOctokit(),
      });

      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(true);
    });

    it('returns NO_ACTION when @gitbuddy mentioned but prReviewEnabled is false', async () => {
      // prDescriptionEnabled keeps the handler active, but prReviewEnabled=false blocks the review response
      handler = new CopilotHandler(createMockLogger(), createMockConfig({
        'copilot.prDescriptionEnabled': true,
        'copilot.prReviewEnabled': false,
      }));
      const octokit = createMockOctokit();
      const context = createContext({
        name: 'issue_comment.created',
        payload: {
          comment: { id: 8, body: '@gitbuddy please review', user: { login: 'dev' } },
          issue: { number: 102, pull_request: {} },
        },
        octokit,
      });

      const result = await handler.handle(context);
      expect(result.actionTaken).toBe(false);
      expect(octokit.createIssueComment).not.toHaveBeenCalled();
    });
  });
});
