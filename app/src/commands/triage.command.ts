/**
 * /triage command — triage an issue by applying standard labels and assignment.
 *
 * Usage: /triage
 */

import { injectable, inject } from 'inversify';
import { TYPES } from '../di/types.js';
import type { ICommand, IConfigProvider, CommandContext, CommandResult } from '../core/interfaces.js';

@injectable()
export class TriageCommand implements ICommand {
  readonly name = 'triage';
  readonly description = 'Triage the issue with default labels and assignee';

  constructor(@inject(TYPES.ConfigProvider) private readonly config: IConfigProvider) {}

  async execute(context: CommandContext): Promise<CommandResult> {
    const defaultLabels = this.config.get<string[]>('automation.defaultIssueLabels', ['triage']);

    if (defaultLabels.length > 0) {
      await context.octokit.addLabels(context.owner, context.repo, context.issueNumber, defaultLabels);
    }

    return {
      message: `🔍 Issue #${context.issueNumber} triaged by @${context.sender}. Labels: \`${defaultLabels.join(', ')}\``,
      success: true,
    };
  }
}
