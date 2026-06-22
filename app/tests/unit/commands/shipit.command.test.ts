/**
 * ShipitCommand unit tests.
 *
 * Tests /shipit command for merging PRs after checks pass.
 */

import { jest, describe, it, beforeEach, expect } from '@jest/globals';
import { ShipitCommand } from '../../../src/commands/shipit.command.js';
import type { CommandContext } from '../../../src/core/interfaces.js';

function createContext(overrides: Partial<CommandContext> = {}): CommandContext {
  return {
    owner: 'test-org',
    repo: 'test-repo',
    issueNumber: 42,
    commentId: 123,
    args: [],
    sender: 'dev-user',
    isPR: false,
    octokit: {
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
    },
    ...overrides,
  };
}

describe('ShipitCommand', () => {
  let command: ShipitCommand;

  beforeEach(() => {
    command = new ShipitCommand();
  });

  it('has correct name and description', () => {
    expect(command.name).toBe('shipit');
    expect(command.description).toBe('Merge the PR after all checks pass');
  });

  it('returns warning when context.isPR is false (success: false)', async () => {
    const context = createContext({ isPR: false });
    const result = await command.execute(context);

    expect(result.success).toBe(false);
    expect(result.message).toBe(
      '⚠️ `/shipit` can only be used on pull requests.',
    );
  });

  it('returns success message when context.isPR is true (success: true)', async () => {
    const context = createContext({ isPR: true });
    const result = await command.execute(context);

    expect(result.success).toBe(true);
    expect(result.message).toContain('Shipit requested by @dev-user');
    expect(result.message).toContain('PR #42');
  });

  it('includes the sender in the success message', async () => {
    const context = createContext({
      isPR: true,
      sender: 'reviewer-1',
    });
    const result = await command.execute(context);

    expect(result.message).toContain('@reviewer-1');
  });

  it('includes the PR number in the success message', async () => {
    const context = createContext({
      isPR: true,
      issueNumber: 99,
    });
    const result = await command.execute(context);

    expect(result.message).toContain('PR #99');
  });
});
