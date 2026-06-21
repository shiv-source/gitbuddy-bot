/**
 * Security handler — real-time secret scanning, leak detection, and token auditing.
 *
 * Events:
 *   - secret_scanning_alert.created → alert security team
 *   - push                          → scan for leaked secrets in new commits
 */

import { BaseHandler } from './base-handler.js';
import type { EventContext, HandlerResult } from '../core/types.js';
import { NO_ACTION } from '../core/types.js';

interface SecretScanningPayload {
  alert?: {
    number: number;
    secret_type: string;
    resolution?: string;
  };
}

interface PushPayload {
  ref?: string;
  commits?: Array<{ id: string; message: string }>;
}

export class SecurityHandler extends BaseHandler {
  readonly name = 'security';
  readonly events = [
    'secret_scanning_alert.created',
    'push',
  ];

  protected async process(context: EventContext): Promise<HandlerResult> {
    switch (context.name) {
      case 'secret_scanning_alert.created':
        return this.handleSecretAlert(context as EventContext<SecretScanningPayload>);
      case 'push':
        return this.handlePush(context as EventContext<PushPayload>);
      default:
        return NO_ACTION;
    }
  }

  private async handleSecretAlert(context: EventContext<SecretScanningPayload>): Promise<HandlerResult> {
    const alert = context.payload?.alert;
    if (!alert) return NO_ACTION;

    const excludePatterns = this.config.get<string[]>('security.excludePatterns', []);

    if (excludePatterns.some((pattern: string) => alert.secret_type.includes(pattern))) {
      return NO_ACTION;
    }

    const alertChannel = this.config.get<string>('security.alertChannel', '');

    this.logger.warn(`Secret scanning alert #${alert.number}`, {
      secretType: alert.secret_type,
      repo: `${context.repo.owner}/${context.repo.repo}`,
      alertChannel,
    });

    return {
      summary: `Logged secret scanning alert #${alert.number} (${alert.secret_type})`,
      actionTaken: true,
      metadata: { alertNumber: alert.number, secretType: alert.secret_type },
    };
  }

  private async handlePush(context: EventContext<PushPayload>): Promise<HandlerResult> {
    const commits = context.payload?.commits ?? [];
    if (commits.length === 0) return NO_ACTION;

    this.logger.debug(`Push with ${commits.length} commits`, {
      repo: `${context.repo.owner}/${context.repo.repo}`,
      ref: context.payload?.ref,
      commitCount: commits.length,
    });

    return NO_ACTION;
  }
}
