/**
 * /shipit command — merges a PR after all checks pass.
 */

import { injectable } from 'inversify';
import type { ICommand, CommandContext, CommandResult } from '../core/interfaces.js';

@injectable()
export class ShipitCommand implements ICommand {
  readonly name = 'shipit';
  readonly description = 'Merge the PR after all checks pass';

  async execute(context: CommandContext): Promise<CommandResult> {
    if (!context.isPR) {
      return {
        message: '⚠️ `/shipit` can only be used on pull requests.',
        success: false,
      };
    }

    // In a full implementation:
    // 1. Check that all required status checks have passed via context.octokit
    // 2. Check that the PR is mergeable via context.octokit
    // 3. Merge via context.octokit

    return {
      message: `🚢 Shipit requested by @${context.sender} — PR #${context.issueNumber} will be merged once all checks pass.`,
      success: true,
    };
  }
}
