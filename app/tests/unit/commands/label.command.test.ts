/**
 * LabelCommand unit tests.
 *
 * Tests /label command for adding and removing labels on issues/PRs.
 */

import { jest, describe, it, beforeEach, expect } from '@jest/globals';
import { LabelCommand } from '../../../src/commands/label.command.js';
import type { IGitHubClient, CommandContext } from '../../../src/core/interfaces.js';

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

describe('LabelCommand', () => {
  let command: LabelCommand;

  beforeEach(() => {
    command = new LabelCommand();
  });

  it('has correct name and description', () => {
    expect(command.name).toBe('label');
    expect(command.description).toBe('Add or remove labels. `/label bug` or `/label -bug`');
  });

  it('returns usage message when args is empty (success: false)', async () => {
    const context = createContext({ args: [] });
    const result = await command.execute(context);

    expect(result.success).toBe(false);
    expect(result.message).toBe(
      'Usage: `/label <name>` to add, `/label -<name>` to remove.',
    );
  });

  it('adds labels when args are plain strings', async () => {
    const octokit = createMockOctokit();
    const context = createContext({ args: ['bug', 'enhancement'], octokit });

    const result = await command.execute(context);

    expect(octokit.addLabels).toHaveBeenCalledWith(
      'test-org',
      'test-repo',
      42,
      ['bug', 'enhancement'],
    );
    expect(octokit.removeLabel).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it('removes labels when args start with "-"', async () => {
    const octokit = createMockOctokit();
    const context = createContext({ args: ['-bug'], octokit });

    const result = await command.execute(context);

    expect(octokit.addLabels).not.toHaveBeenCalled();
    expect(octokit.removeLabel).toHaveBeenCalledWith(
      'test-org',
      'test-repo',
      42,
      'bug',
    );
    expect(result.success).toBe(true);
  });

  it('handles mixed add/remove in one call', async () => {
    const octokit = createMockOctokit();
    const context = createContext({
      args: ['bug', '-old-feature', 'enhancement'],
      octokit,
    });

    const result = await command.execute(context);

    expect(octokit.addLabels).toHaveBeenCalledWith(
      'test-org',
      'test-repo',
      42,
      ['bug', 'enhancement'],
    );
    expect(octokit.removeLabel).toHaveBeenCalledWith(
      'test-org',
      'test-repo',
      42,
      'old-feature',
    );
    expect(result.success).toBe(true);
  });

  it('returns success message mentioning added labels', async () => {
    const octokit = createMockOctokit();
    const context = createContext({ args: ['bug'], octokit });

    const result = await command.execute(context);

    expect(result.message).toBe(
      '✅ Labels added `bug` by @test-user.',
    );
  });

  it('returns success message mentioning removed labels', async () => {
    const octokit = createMockOctokit();
    const context = createContext({ args: ['-bug'], octokit });

    const result = await command.execute(context);

    expect(result.message).toBe(
      '✅ Labels removed `bug` by @test-user.',
    );
  });

  it('returns success message mentioning both added and removed labels', async () => {
    const octokit = createMockOctokit();
    const context = createContext({
      args: ['bug', '-old-feature'],
      octokit,
    });

    const result = await command.execute(context);

    expect(result.message).toBe(
      '✅ Labels added `bug` and removed `old-feature` by @test-user.',
    );
  });

  it('returns success: true when labels are modified', async () => {
    const octokit = createMockOctokit();
    const context = createContext({ args: ['bug'], octokit });

    const result = await command.execute(context);

    expect(result.success).toBe(true);
  });
});
