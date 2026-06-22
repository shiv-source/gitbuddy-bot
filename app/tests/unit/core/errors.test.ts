/**
 * Error hierarchy unit tests.
 *
 * Tests every error class and verifies correct fields, inheritance,
 * and the constructor parameters propagate correctly.
 */

import { describe, it, expect } from '@jest/globals';
import {
  AppError,
  ConfigError,
  ConfigNotFoundError,
  RateLimitError,
  ValidationError,
  GitHubApiError,
  NotFoundError,
  HandlerError,
} from '../../../src/core/errors.js';

describe('AppError', () => {
  // AppError is abstract, test via a concrete subclass
  it('sets name to the concrete class name', () => {
    const err = new ConfigError('test');
    expect(err.name).toBe('ConfigError');
  });

  it('is an instance of Error', () => {
    const err = new ConfigError('test');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });
});

describe('ConfigError', () => {
  it('has code CONFIG_ERROR', () => {
    const err = new ConfigError('bad config');
    expect(err.code).toBe('CONFIG_ERROR');
  });

  it('has statusCode 500', () => {
    const err = new ConfigError('bad config');
    expect(err.statusCode).toBe(500);
  });

  it('is not recoverable', () => {
    const err = new ConfigError('bad config');
    expect(err.recoverable).toBe(false);
  });

  it('sets the message', () => {
    const err = new ConfigError('bad config');
    expect(err.message).toBe('bad config');
  });
});

describe('ConfigNotFoundError', () => {
  it('extends ConfigError', () => {
    const err = new ConfigNotFoundError('/some/path');
    expect(err).toBeInstanceOf(ConfigError);
    expect(err).toBeInstanceOf(AppError);
  });

  it('formats message with the path', () => {
    const err = new ConfigNotFoundError('/some/path/config.yml');
    expect(err.message).toContain('Configuration file not found');
    expect(err.message).toContain('/some/path/config.yml');
  });

  it('inherits code CONFIG_ERROR from ConfigError', () => {
    const err = new ConfigNotFoundError('/p');
    expect(err.code).toBe('CONFIG_ERROR');
    expect(err.statusCode).toBe(500);
    expect(err.recoverable).toBe(false);
  });
});

describe('RateLimitError', () => {
  it('has code RATE_LIMIT', () => {
    const err = new RateLimitError(30);
    expect(err.code).toBe('RATE_LIMIT');
  });

  it('has statusCode 429', () => {
    const err = new RateLimitError(30);
    expect(err.statusCode).toBe(429);
  });

  it('is recoverable', () => {
    const err = new RateLimitError(30);
    expect(err.recoverable).toBe(true);
  });

  it('stores retryAfter seconds', () => {
    const err = new RateLimitError(60);
    expect(err.retryAfter).toBe(60);
  });

  it('formats message with retryAfter', () => {
    const err = new RateLimitError(45);
    expect(err.message).toContain('45s');
    expect(err.message).toContain('Retry after');
  });
});

describe('ValidationError', () => {
  it('has code VALIDATION_ERROR', () => {
    const err = new ValidationError('invalid input');
    expect(err.code).toBe('VALIDATION_ERROR');
  });

  it('has statusCode 400', () => {
    const err = new ValidationError('invalid input');
    expect(err.statusCode).toBe(400);
  });

  it('is not recoverable', () => {
    const err = new ValidationError('invalid input');
    expect(err.recoverable).toBe(false);
  });

  it('sets the message', () => {
    const err = new ValidationError('missing payload');
    expect(err.message).toBe('missing payload');
  });
});

describe('GitHubApiError', () => {
  it('has code GITHUB_API_ERROR', () => {
    const err = new GitHubApiError('API failed');
    expect(err.code).toBe('GITHUB_API_ERROR');
  });

  it('defaults statusCode to 502', () => {
    const err = new GitHubApiError('API failed');
    expect(err.statusCode).toBe(502);
  });

  it('accepts custom statusCode', () => {
    const err = new GitHubApiError('not found', 404);
    expect(err.statusCode).toBe(404);
  });

  it('is recoverable', () => {
    const err = new GitHubApiError('API failed');
    expect(err.recoverable).toBe(true);
  });

  it('sets the message', () => {
    const err = new GitHubApiError('custom message');
    expect(err.message).toBe('custom message');
  });
});

describe('NotFoundError', () => {
  it('has code NOT_FOUND', () => {
    const err = new NotFoundError('repository', 'my-repo');
    expect(err.code).toBe('NOT_FOUND');
  });

  it('has statusCode 404', () => {
    const err = new NotFoundError('repository', 'my-repo');
    expect(err.statusCode).toBe(404);
  });

  it('is not recoverable', () => {
    const err = new NotFoundError('repository', 'my-repo');
    expect(err.recoverable).toBe(false);
  });

  it('formats message with resource and id', () => {
    const err = new NotFoundError('branch', 'main');
    expect(err.message).toContain('branch');
    expect(err.message).toContain('main');
    expect(err.message).toContain('not found');
  });
});

describe('HandlerError', () => {
  it('has code HANDLER_ERROR', () => {
    const cause = new Error('underlying issue');
    const err = new HandlerError('testHandler', cause);
    expect(err.code).toBe('HANDLER_ERROR');
  });

  it('has statusCode 500', () => {
    const cause = new Error('underlying issue');
    const err = new HandlerError('testHandler', cause);
    expect(err.statusCode).toBe(500);
  });

  it('is recoverable', () => {
    const cause = new Error('underlying issue');
    const err = new HandlerError('testHandler', cause);
    expect(err.recoverable).toBe(true);
  });

  it('formats message with handler name and cause message', () => {
    const cause = new Error('underlying issue');
    const err = new HandlerError('automation', cause);
    expect(err.message).toContain('automation');
    expect(err.message).toContain('underlying issue');
    expect(err.message).toContain('failed');
  });

  it('inherits stack from cause', () => {
    const cause = new Error('original');
    const err = new HandlerError('stale', cause);
    expect(err.stack).toBe(cause.stack);
  });
});
