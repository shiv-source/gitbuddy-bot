/**
 * /label command — add or remove labels on an issue or PR.
 *
 * Usage:
 *   /label bug enhancement        (adds labels)
 *   /label -bug                    (removes "bug" label)
 */

import { injectable } from 'inversify';
import type { ICommand, CommandContext, CommandResult } from '../core/interfaces.js';

@injectable()
export class LabelCommand implements ICommand {
  readonly name = 'label';
  readonly description = 'Add or remove labels. `/label bug` or `/label -bug`';

  async execute(context: CommandContext): Promise<CommandResult> {
    if (context.args.length === 0) {
      return {
        message: 'Usage: `/label <name>` to add, `/label -<name>` to remove.',
        success: false,
      };
    }

    const toAdd: string[] = [];
    const toRemove: string[] = [];

    for (const arg of context.args) {
      if (arg.startsWith('-')) {
        toRemove.push(arg.slice(1));
      } else {
        toAdd.push(arg);
      }
    }

    if (toAdd.length > 0) {
      await context.octokit.addLabels(context.owner, context.repo, context.issueNumber, toAdd);
    }

    for (const label of toRemove) {
      await context.octokit.removeLabel(context.owner, context.repo, context.issueNumber, label);
    }

    const parts: string[] = [];
    if (toAdd.length > 0) parts.push(`added \`${toAdd.join(', ')}\``);
    if (toRemove.length > 0) parts.push(`removed \`${toRemove.join(', ')}\``);

    return {
      message: `✅ Labels ${parts.join(' and ')} by @${context.sender}.`,
      success: true,
    };
  }
}
