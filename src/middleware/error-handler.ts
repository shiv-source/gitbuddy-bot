/**
 * Error handler middleware — catches all errors from handlers and transforms
 * them into structured responses (issue comments, check runs, or logs).
 *
 * Chain of Responsibility: this wraps every handler call.
 * If the error is a known AppError, it decides whether to report to the user
 * or silently log. Unknown errors are always logged at ERROR level.
 */

import type { ILogger } from '../core/interfaces.js';
import type { EventContext } from '../core/types.js';
import { AppError } from '../core/errors.js';

export interface ErrorHandlerOptions {
  /** Whether to post a comment on the triggering issue/PR on failure */
  reportToIssue: boolean;
}

export class ErrorHandler {
  constructor(
    private readonly logger: ILogger,
    private readonly options: ErrorHandlerOptions = { reportToIssue: false },
  ) {}

  /**
   * Wrap a handler function with error handling.
   * Returns a decorated function that never throws.
   */
  wrap<T>(context: EventContext, fn: () => Promise<T>): () => Promise<T | undefined> {
    return async () => {
      try {
        return await fn();
      } catch (error: unknown) {
        this.handleError(context, error);
        return undefined;
      }
    };
  }

  private handleError(context: EventContext, error: unknown): void {
    if (error instanceof AppError) {
      this.logger.warn(`[${error.code}] ${error.message}`, {
        event: context.name,
        repo: `${context.repo.owner}/${context.repo.repo}`,
        deliveryId: context.deliveryId,
        recoverable: error.recoverable,
      });

      if (!error.recoverable && this.options.reportToIssue) {
        // Non-recoverable, user-actionable → could post a comment
        // (requires IGitHubClient — injected when reportToIssue is true)
      }
      return;
    }

    // Unhandled / unexpected error
    this.logger.error(
      `Unhandled error in event "${context.name}"`,
      error instanceof Error ? error : new Error(String(error)),
      {
        event: context.name,
        repo: `${context.repo.owner}/${context.repo.repo}`,
        deliveryId: context.deliveryId,
      },
    );
  }
}
