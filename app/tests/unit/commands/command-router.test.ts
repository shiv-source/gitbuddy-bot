/**
 * CommandRouter unit tests.
 *
 * Tests parsing of /command syntax, dispatching to ICommand implementations,
 * error handling, and command registration.
 */

import { jest, describe, it, beforeEach, expect } from '@jest/globals';
import { CommandRouter } from '../../../src/commands/command-router.js';
import type { ILogger, ICommand, IGitHubClient, CommandContext, CommandResult } from '../../../src/core/interfaces.js';

// ── Helpers ──────────────────────────────────────────────────────

function createMockLogger(): jest.Mocked<ILogger> {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

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

/**
 * Create a mock command with the given name, description, and execute handler.
 */
function createMockCommand(
  name: string,
  description: string,
  executeFn?: (context: CommandContext) => Promise<CommandResult>,
): jest.Mocked<ICommand> {
  return {
    name,
    description,
    execute: jest.fn(executeFn ?? (async () => ({ message: `${name} executed`, success: true }))),
  };
}

const DEFAULT_BASE_CONTEXT = {
  owner: 'test-org',
  repo: 'test-repo',
  issueNumber: 42,
  commentId: 123,
  sender: 'test-user',
  isPR: false,
};

// ── Tests ────────────────────────────────────────────────────────

describe('CommandRouter', () => {
  let logger: jest.Mocked<ILogger>;
  let router: CommandRouter;

  beforeEach(() => {
    logger = createMockLogger();
  });

  // ── Constructor / Registration ───────────────────────────────

  it('registers all commands passed via the constructor', () => {
    const cmd1 = createMockCommand('label', 'Add labels');
    const cmd2 = createMockCommand('shipit', 'Merge PR');

    router = new CommandRouter(logger, [cmd1, cmd2]);

    const list = router.listCommands();
    expect(list).toHaveLength(2);
    expect(list).toEqual(
      expect.arrayContaining([
        { name: 'label', description: 'Add labels' },
        { name: 'shipit', description: 'Merge PR' },
      ]),
    );
  });

  it('register() adds command to internal map and logs debug', () => {
    router = new CommandRouter(logger, []);
    const cmd = createMockCommand('label', 'Add labels');

    router.register(cmd);

    expect(logger.debug).toHaveBeenCalledWith('Registered command: /label');
    const list = router.listCommands();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('label');
  });

  it('register() warns when overwriting an existing command name', () => {
    router = new CommandRouter(logger, []);
    const cmd1 = createMockCommand('label', 'Add labels');
    const cmd2 = createMockCommand('label', 'New label command');

    router.register(cmd1);
    router.register(cmd2);

    expect(logger.warn).toHaveBeenCalledWith(
      'Command "label" already registered — overwriting',
    );
    const list = router.listCommands();
    expect(list).toHaveLength(1);
    expect(list[0].description).toBe('New label command');
  });

  // ── execute: no command found ─────────────────────────────────

  it('execute() returns null when no /command syntax found in body', async () => {
    router = new CommandRouter(logger, []);
    const result = await router.execute(
      'This is a regular comment with no command.',
      DEFAULT_BASE_CONTEXT,
      createMockOctokit(),
    );

    expect(result).toBeNull();
  });

  it('execute() returns null for unknown command name', async () => {
    router = new CommandRouter(logger, []);
    const cmd = createMockCommand('label', 'Add labels');
    router.register(cmd);

    const result = await router.execute(
      '/unknown-command some args',
      DEFAULT_BASE_CONTEXT,
      createMockOctokit(),
    );

    expect(result).toBeNull();
  });

  it('execute() skips lines with just a slash and no command name', async () => {
    const labelCmd = createMockCommand('label', 'Add labels');
    router = new CommandRouter(logger, [labelCmd]);

    const result = await router.execute(
      'Some text\n/\nMore text',
      DEFAULT_BASE_CONTEXT,
      createMockOctokit(),
    );

    // Line with just "/" should be skipped; "Some text" and "More text" have no "/" prefix
    expect(labelCmd.execute).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  // ── execute: successful dispatch ──────────────────────────────

  it('parses /label bug from comment body and dispatches to LabelCommand', async () => {
    const labelCmd = createMockCommand('label', 'Add labels');
    router = new CommandRouter(logger, [labelCmd]);

    const octokit = createMockOctokit();
    const result = await router.execute(
      '/label bug',
      DEFAULT_BASE_CONTEXT,
      octokit,
    );

    expect(labelCmd.execute).toHaveBeenCalledTimes(1);
    expect(result).toBe('label executed');
    expect(logger.info).toHaveBeenCalledWith(
      'Command "/label" executed',
      { success: true, sender: 'test-user' },
    );
  });

  it('passes args to command context (split by whitespace)', async () => {
    const labelCmd = createMockCommand('label', 'Add labels');
    router = new CommandRouter(logger, [labelCmd]);

    const octokit = createMockOctokit();
    await router.execute(
      '/label bug enhancement -old',
      DEFAULT_BASE_CONTEXT,
      octokit,
    );

    const context = labelCmd.execute.mock.calls[0][0];
    expect(context.args).toEqual(['bug', 'enhancement', '-old']);
  });

  it('passes baseContext fields (owner, repo, issueNumber, sender, isPR) to command context', async () => {
    const labelCmd = createMockCommand('label', 'Add labels');
    router = new CommandRouter(logger, [labelCmd]);

    const octokit = createMockOctokit();
    await router.execute(
      '/label bug',
      {
        owner: 'my-org',
        repo: 'my-repo',
        issueNumber: 99,
        commentId: 456,
        sender: 'bot-user',
        isPR: true,
      },
      octokit,
    );

    const context = labelCmd.execute.mock.calls[0][0];
    expect(context.owner).toBe('my-org');
    expect(context.repo).toBe('my-repo');
    expect(context.issueNumber).toBe(99);
    expect(context.commentId).toBe(456);
    expect(context.sender).toBe('bot-user');
    expect(context.isPR).toBe(true);
    // octokit should also be in the context
    expect(context.octokit).toBe(octokit);
  });

  it('handles multi-line comment body (finds first command)', async () => {
    const cmd1 = createMockCommand('label', 'Add labels');
    const cmd2 = createMockCommand('shipit', 'Merge PR');
    router = new CommandRouter(logger, [cmd1, cmd2]);

    const octokit = createMockOctokit();
    const body = [
      'This is a review comment.',
      '',
      'Looks good overall, but please fix the tests.',
      '/label needs-review',
      '/shipit',
      'Thanks!',
    ].join('\n');

    const result = await router.execute(body, DEFAULT_BASE_CONTEXT, octokit);

    // Should dispatch to the first command found (/label)
    expect(cmd1.execute).toHaveBeenCalledTimes(1);
    expect(cmd2.execute).not.toHaveBeenCalled();
    expect(result).toBe('label executed');
  });

  // ── execute: error handling ──────────────────────────────────

  it('catches command errors and returns error message string', async () => {
    const failingCmd = createMockCommand(
      'label',
      'Add labels',
      async () => {
        throw new Error('Something went wrong');
      },
    );
    router = new CommandRouter(logger, [failingCmd]);

    const octokit = createMockOctokit();
    const result = await router.execute(
      '/label bug',
      DEFAULT_BASE_CONTEXT,
      octokit,
    );

    expect(result).toBe(
      '❌ Command "/label" failed. Check logs for details.',
    );
  });

  it('logs error when command fails', async () => {
    const error = new Error('API failure');
    const failingCmd = createMockCommand(
      'label',
      'Add labels',
      async () => {
        throw error;
      },
    );
    router = new CommandRouter(logger, [failingCmd]);

    const octokit = createMockOctokit();
    await router.execute(
      '/label bug',
      DEFAULT_BASE_CONTEXT,
      octokit,
    );

    expect(logger.error).toHaveBeenCalledWith(
      'Command "/label" failed',
      error,
      { sender: 'test-user', args: ['bug'] },
    );
  });

  // ── listCommands ─────────────────────────────────────────────

  it('listCommands() returns all registered commands with name and description', () => {
    const cmd1 = createMockCommand('label', 'Add or remove labels');
    const cmd2 = createMockCommand('shipit', 'Merge the PR after all checks pass');
    const cmd3 = createMockCommand('triage', 'Triage the issue with default labels');

    router = new CommandRouter(logger, [cmd1, cmd2, cmd3]);

    const commands = router.listCommands();

    expect(commands).toHaveLength(3);
    expect(commands).toEqual(
      expect.arrayContaining([
        { name: 'label', description: 'Add or remove labels' },
        { name: 'shipit', description: 'Merge the PR after all checks pass' },
        { name: 'triage', description: 'Triage the issue with default labels' },
      ]),
    );
  });
});
