/**
 * Automation handler unit tests.
 *
 * Tests default label application, rule-based label matching,
 * PR reviewer assignment, and graceful error handling.
 */

import { jest, describe, it, beforeEach, expect } from '@jest/globals';
import { AutomationHandler } from '../../../src/handlers/automation.handler.js';
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
    'automation.defaultIssueLabels': [],
    'automation.labelRules': [],
    'automation.reviewerTeam': '',
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

function createIssueContext(overrides: Partial<EventContext> = {}): EventContext {
  return {
    name: 'issues.opened',
    deliveryId: 'test-1',
    payload: {
      action: 'opened',
      issue: {
        number: 42,
        title: 'Bug: something is broken',
        body: 'This is a test issue about performance',
        user: { login: 'test-user' },
      },
    },
    repo: { owner: 'test-org', repo: 'test-repo' },
    org: 'test-org',
    sender: 'test-user',
    octokit: createMockOctokit(),
    ...overrides,
  };
}

function createPRContext(overrides: Partial<EventContext> = {}): EventContext {
  return {
    name: 'pull_request.opened',
    deliveryId: 'test-pr-1',
    payload: {
      action: 'opened',
      pull_request: {
        number: 99,
        title: 'feat: add new API endpoint',
        body: 'This PR adds a new /api/v2 endpoint.',
        user: { login: 'dev-user' },
      },
    },
    repo: { owner: 'test-org', repo: 'test-repo' },
    org: 'test-org',
    sender: 'dev-user',
    octokit: createMockOctokit(),
    ...overrides,
  };
}

describe('AutomationHandler', () => {
  let handler: AutomationHandler;
  let logger: ILogger;

  beforeEach(() => {
    logger = createMockLogger();
    handler = new AutomationHandler(logger, createMockConfig());
  });

  it('has the correct handler metadata', () => {
    expect(handler.name).toBe('automation');
    expect(handler.events).toContain('issues.opened');
    expect(handler.events).toContain('pull_request.opened');
    expect(handler.events).toContain('issues.labeled');
  });

  // ── Default labels ──────────────────────────────────────────

  it('applies default labels to new issues', async () => {
    const config = createMockConfig({
      'automation.defaultIssueLabels': ['triage', 'bug'],
    });
    handler = new AutomationHandler(logger, config);

    const octokit = createMockOctokit();
    const context = createIssueContext({ octokit });

    const result = await handler.handle(context);

    expect(result.actionTaken).toBe(true);
    expect(octokit.addLabels).toHaveBeenCalledWith(
      'test-org',
      'test-repo',
      42,
      ['triage', 'bug'],
    );
  });

  it('returns NO_ACTION when no default labels and no matching rules', async () => {
    const context = createIssueContext();
    const result = await handler.handle(context);

    expect(result.actionTaken).toBe(false);
    expect(context.octokit.addLabels).not.toHaveBeenCalled();
  });

  // ── Label rules: pattern matching ───────────────────────────

  it('applies rule-based labels when title matches a pattern', async () => {
    const config = createMockConfig({
      'automation.labelRules': [
        { pattern: 'bug', label: 'bug' },
        { pattern: 'performance', label: 'perf' },
      ],
    });
    handler = new AutomationHandler(logger, config);

    const octokit = createMockOctokit();
    const context = createIssueContext({
      octokit,
      payload: {
        action: 'opened',
        issue: {
          number: 42,
          title: 'Bug: something is broken', // matches "bug" pattern
          body: 'Just a description',
          user: { login: 'test-user' },
        },
      },
    });

    const result = await handler.handle(context);

    expect(result.actionTaken).toBe(true);
    expect(octokit.addLabels).toHaveBeenCalledWith(
      'test-org',
      'test-repo',
      42,
      ['bug'], // only the title-matched rule
    );
  });

  it('matches rules against both title and body', async () => {
    const config = createMockConfig({
      'automation.labelRules': [
        { pattern: 'api', label: 'api' },
        { pattern: 'endpoint', label: 'enhancement' },
      ],
    });
    handler = new AutomationHandler(logger, config);

    const octokit = createMockOctokit();
    const context = createPRContext({
      octokit,
      payload: {
        action: 'opened',
        pull_request: {
          number: 99,
          title: 'feat: add new API endpoint',
          body: 'Adds /api/v2', // body also contains "api"
          user: { login: 'dev-user' },
        },
      },
    });

    const result = await handler.handle(context);

    expect(result.actionTaken).toBe(true);
    expect(octokit.addLabels).toHaveBeenCalledWith(
      'test-org',
      'test-repo',
      99,
      ['api', 'enhancement'],
    );
  });

  it('combines default labels with rule-based labels (no duplicates)', async () => {
    const config = createMockConfig({
      'automation.defaultIssueLabels': ['triage'],
      'automation.labelRules': [
        { pattern: 'bug', label: 'bug' },
        { pattern: 'triage', label: 'triage' }, // same as default — should dedupe
      ],
    });
    handler = new AutomationHandler(logger, config);

    const octokit = createMockOctokit();
    const context = createIssueContext({
      octokit,
      payload: {
        action: 'opened',
        issue: {
          number: 42,
          title: 'Bug: broken, triage needed',
          body: '',
          user: { login: 'test-user' },
        },
      },
    });

    const result = await handler.handle(context);

    // 'triage' appears in both defaults and rules — should be deduplicated
    expect(octokit.addLabels).toHaveBeenCalledWith(
      'test-org',
      'test-repo',
      42,
      ['triage', 'bug'],
    );
  });

  it('gracefully handles invalid regex patterns', async () => {
    const config = createMockConfig({
      'automation.labelRules': [
        { pattern: '[invalid', label: 'broken' }, // unclosed bracket
        { pattern: 'valid', label: 'valid-label' },
      ],
    });
    handler = new AutomationHandler(logger, config);

    const octokit = createMockOctokit();
    const context = createIssueContext({
      octokit,
      payload: {
        action: 'opened',
        issue: {
          number: 42,
          title: 'valid pattern here',
          body: '',
          user: { login: 'test-user' },
        },
      },
    });

    const result = await handler.handle(context);

    // Should still apply the valid rule and skip the invalid one
    expect(octokit.addLabels).toHaveBeenCalledWith(
      'test-org',
      'test-repo',
      42,
      ['valid-label'],
    );
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Invalid label rule pattern'),
      expect.anything(),
    );
  });

  // ── PR-specific: labels + reviewer ─────────────────────────

  it('applies labels AND assigns a reviewer for new PRs', async () => {
    const config = createMockConfig({
      'automation.defaultIssueLabels': ['needs-review'],
      'automation.labelRules': [{ pattern: 'api', label: 'api' }],
      'automation.reviewerTeam': 'platform-team',
    });
    handler = new AutomationHandler(logger, config);

    const octokit = createMockOctokit();
    octokit.getTeamMembers.mockResolvedValue([
      { login: 'dev-user' },
      { login: 'reviewer-1' },
    ]);

    const context = createPRContext({
      octokit,
      payload: {
        action: 'opened',
        pull_request: {
          number: 99,
          title: 'feat: add new API endpoint',
          body: '',
          user: { login: 'dev-user' },
        },
      },
    });

    const result = await handler.handle(context);

    expect(result.actionTaken).toBe(true);

    // Labels applied
    expect(octokit.addLabels).toHaveBeenCalledWith(
      'test-org',
      'test-repo',
      99,
      ['needs-review', 'api'],
    );

    // Reviewer assigned (not the author)
    expect(octokit.requestReviewers).toHaveBeenCalledWith(
      'test-org',
      'test-repo',
      99,
      ['reviewer-1'],
    );
  });

  it('skips reviewer assignment when no team is configured', async () => {
    const config = createMockConfig({
      'automation.defaultIssueLabels': ['needs-review'],
    });
    handler = new AutomationHandler(logger, config);

    const octokit = createMockOctokit();
    const context = createPRContext({ octokit });

    const result = await handler.handle(context);

    expect(octokit.addLabels).toHaveBeenCalled();
    expect(octokit.getTeamMembers).not.toHaveBeenCalled();
    expect(octokit.requestReviewers).not.toHaveBeenCalled();
  });

  // ── issues.labeled ─────────────────────────────────────────

  it('logs label events without taking action', async () => {
    const context = createIssueContext({
      name: 'issues.labeled',
      payload: {
        action: 'labeled',
        issue: { number: 42, title: 'test', user: { login: 'a' } },
        label: { name: 'bug' },
      },
    });

    const result = await handler.handle(context);
    expect(result.actionTaken).toBe(false);
  });

  // ── Unknown events ─────────────────────────────────────────

  it('returns NO_ACTION for unknown events', async () => {
    const context = createIssueContext({ name: 'unknown.event' });
    const result = await handler.handle(context);
    expect(result.actionTaken).toBe(false);
  });
});
