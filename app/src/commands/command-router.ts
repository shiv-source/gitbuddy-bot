/**
 * Command Router — parses /command syntax from issue comments and dispatches
 * to the matching ICommand implementation.
 *
 * Command Pattern: each command is an ICommand. The router is the invoker.
 * Adding a new command = one new file implementing ICommand + register it.
 * Zero changes to existing commands or handlers.
 */

import { injectable, inject, multiInject } from 'inversify';
import { TYPES } from '../di/types.js';
import type { ICommand, ILogger, IGitHubClient, CommandContext, ICommandRouter } from '../core/interfaces.js';

const COMMAND_PREFIX = '/';

@injectable()
export class CommandRouter implements ICommandRouter {
  private commands = new Map<string, ICommand>();

  constructor(
    @inject(TYPES.Logger) private readonly logger: ILogger,
    @multiInject(TYPES.Command) commands: ICommand[],
  ) {
    for (const cmd of commands) {
      this.register(cmd);
    }
  }

  /** Register a command. Call during app bootstrap. */
  register(command: ICommand): void {
    if (this.commands.has(command.name)) {
      this.logger.warn(`Command "${command.name}" already registered — overwriting`);
    }
    this.commands.set(command.name, command);
    this.logger.debug(`Registered command: /${command.name}`);
  }

  /**
   * Parse a comment body and execute the first matching command.
   * @param body — raw comment body
   * @param baseContext — owner, repo, issueNumber, sender, isPR (without octokit)
   * @param octokit — per-event authenticated GitHub client
   */
  async execute(body: string, baseContext: Omit<CommandContext, 'octokit'>, octokit: IGitHubClient): Promise<string | null> {
    const lines = body.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith(COMMAND_PREFIX)) continue;

      const parts = trimmed.slice(1).split(/\s+/);
      const name = parts[0]?.toLowerCase();
      const args = parts.slice(1);

      if (!name) continue;

      const command = this.commands.get(name);
      if (!command) continue;

      const context: CommandContext = { ...baseContext, args, octokit };

      try {
        const result = await command.execute(context);
        this.logger.info(`Command "/${command.name}" executed`, {
          success: result.success,
          sender: context.sender,
        });
        return result.message;
      } catch (error) {
        this.logger.error(`Command "/${command.name}" failed`, error as Error, {
          sender: context.sender,
          args,
        });
        return `❌ Command "/${command.name}" failed. Check logs for details.`;
      }
    }

    return null; // No command found
  }

  /** List all registered commands (for /help). */
  listCommands(): Array<{ name: string; description: string }> {
    return Array.from(this.commands.values()).map((c) => ({
      name: c.name,
      description: c.description,
    }));
  }
}
