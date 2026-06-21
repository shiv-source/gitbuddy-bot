/**
 * Domain-level error hierarchy for Watchdog Pro.
 *
 * Every error thrown by the app extends AppError so the error-handler
 * middleware can classify and format it consistently.
 */

export abstract class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly recoverable: boolean;

  constructor(message: string, code: string, statusCode: number, recoverable: boolean) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.recoverable = recoverable;
  }
}

// ── Configuration ────────────────────────────────────────────

export class ConfigError extends AppError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR', 500, false);
  }
}

export class ConfigNotFoundError extends ConfigError {
  constructor(path: string) {
    super(`Configuration file not found: ${path}`);
  }
}

// ── Rate Limiting ─────────────────────────────────────────────

export class RateLimitError extends AppError {
  public readonly retryAfter: number; // seconds

  constructor(retryAfter: number) {
    super(
      `GitHub API rate limit exceeded. Retry after ${retryAfter}s`,
      'RATE_LIMIT',
      429,
      true, // recoverable — wait and retry
    );
    this.retryAfter = retryAfter;
  }
}

// ── Validation ────────────────────────────────────────────────

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400, false);
  }
}

// ── GitHub API ────────────────────────────────────────────────

export class GitHubApiError extends AppError {
  constructor(message: string, statusCode: number = 502) {
    super(message, 'GITHUB_API_ERROR', statusCode, true);
  }
}

// ── Not Found ─────────────────────────────────────────────────

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND', 404, false);
  }
}

// ── Handler ───────────────────────────────────────────────────

export class HandlerError extends AppError {
  constructor(handlerName: string, cause: Error) {
    super(
      `Handler "${handlerName}" failed: ${cause.message}`,
      'HANDLER_ERROR',
      500,
      true,
    );
    this.stack = cause.stack;
  }
}
