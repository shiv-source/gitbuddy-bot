/**
 * TriageCommand unit tests.
 *
 * Tests /triage command for applying default labels to issues.
 */

import { jest, describe, it, beforeEach, expect } from '@jest/globals';
import { TriageCommand } from '../../../src/commands/triage.command.js';
import type { IGitHubClient, IConfigProvider, CommandContext } from '../../../src/core/interfaces.js';

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

function createMockConfig(labelsOverride?: string[]): jest.Mocked<IConfigProvider> {
  const configGet = jest.fn(
    <T>(path: string, defaultValue: T): T => {
      if (path === 'automation.defaultIssueLabels') {
        return (labelsOverride ?? defaultValue) as T;
      }
      return defaultValue;
    },
  );

  return {
    getConfig: jest.fn(),
    get: configGet,
    reload: jest.fn(),
  };
}

function createContext(overrides: Partial<CommandContext> = {}): CommandContext {
  return {
    owner: 'test-org',
    repo: 'test-repo',
    issueNumber: 42,
    commentId: 123,
    args: [],
    sender: 'test-user',
    isPR: false,
    octokit: createMockOctokit(),
    ...overrides,
  };
}

describe('TriageCommand', () => {
  let command: TriageCommand;
  let config: jest.Mocked<IConfigProvider>;

  beforeEach(() => {
    config = createMockConfig();
    command = new TriageCommand(config);
  });

  it('has correct name and description', () => {
    expect(command.name).toBe('triage');
    expect(command.description).toBe(
      'Triage the issue with default labels and assignee',
    );
  });

  it('uses default labels ["triage"] when config is unset (falls back to default)', async () => {
    const octokit = createMockOctokit();
    const context = createContext({ octokit });

    const result = await command.execute(context);

    expect(config.get).toHaveBeenCalledWith(
      'automation.defaultIssueLabels',
      ['triage'],
    );
    expect(octokit.addLabels).toHaveBeenCalledWith(
      'test-org',
      'test-repo',
      42,
      ['triage'],
    );
    expect(result.success).toBe(true);
    expect(result.message).toContain('Labels: `triage`');
  });

  it('uses custom labels from config when configured', async () => {
    config = createMockConfig(['bug', 'needs-review']);
    command = new TriageCommand(config);
    const octokit = createMockOctokit();
    const context = createContext({ octokit });

    const result = await command.execute(context);

    expect(octokit.addLabels).toHaveBeenCalledWith(
      'test-org',
      'test-repo',
      42,
      ['bug', 'needs-review'],
    );
    expect(result.message).toContain('Labels: `bug, needs-review`');
  });

  it('calls octokit.addLabels with correct labels', async () => {
    config = createMockConfig(['triage']);
    command = new TriageCommand(config);
    const octokit = createMockOctokit();
    const context = createContext({ octokit });

    await command.execute(context);

    expect(octokit.addLabels).toHaveBeenCalledWith(
      'test-org',
      'test-repo',
      42,
      ['triage'],
    );
    expect(octokit.addLabels).toHaveBeenCalledTimes(1);
  });

  it('returns success message with labels listed', async () => {
    config = createMockConfig(['bug', 'triage']);
    command = new TriageCommand(config);
    const octokit = createMockOctokit();
    const context = createContext({ octokit });

    const result = await command.execute(context);

    expect(result.success).toBe(true);
    expect(result.message).toBe(
      '🔍 Issue #42 triaged by @test-user. Labels: `bug, triage`',
    );
  });

  it('does not call addLabels when config returns empty array', async () => {
    config = createMockConfig([]);
    command = new TriageCommand(config);
    const octokit = createMockOctokit();
    const context = createContext({ octokit });

    const result = await command.execute(context);

    expect(octokit.addLabels).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.message).toContain('Labels: ``');
  });
});
