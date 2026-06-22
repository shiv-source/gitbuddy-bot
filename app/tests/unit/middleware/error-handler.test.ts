/**
 * ErrorHandler unit tests.
 *
 * Tests the wrap() method that catches errors and prevents handler
 * crashes. Verifies AppError subclass handling vs unknown errors,
 * recoverable vs non-recoverable distinction, and log levels.
 */

import { jest, describe, it, beforeEach, expect } from '@jest/globals';
import { ErrorHandler } from '../../../src/middleware/error-handler.js';
import type { ILogger } from '../../../src/core/interfaces.js';
import type { EventContext } from '../../../src/core/types.js';
import { AppError, ConfigError, HandlerError } from '../../../src/core/errors.js';

function createMockLogger(): jest.Mocked<ILogger> {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

function createEventContext(overrides: Partial<EventContext> = {}): EventContext {
  return {
    name: 'issues.opened',
    deliveryId: 'delivery-xyz',
    payload: { action: 'opened' },
    repo: { owner: 'test-org', repo: 'test-repo' },
    org: 'test-org',
    sender: 'test-user',
    octokit: {} as never, // not needed for error handler tests
    ...overrides,
  };
}

describe('ErrorHandler', () => {
  let logger: jest.Mocked<ILogger>;

  beforeEach(() => {
    logger = createMockLogger();
  });

  // ── Properties ────────────────────────────────────────────────

  describe('properties', () => {
    it('has the correct middleware name', () => {
      const handler = new ErrorHandler(logger);
      expect(handler.name).toBe('error-handler');
    });

    it('has the correct priority', () => {
      const handler = new ErrorHandler(logger);
      expect(handler.priority).toBe(300);
    });
  });

  // ── Constructor ───────────────────────────────────────────────

  describe('constructor', () => {
    it('defaults to reportToIssue: false', () => {
      const handler = new ErrorHandler(logger);
      // No crash — construction succeeds with defaults
      expect(handler.name).toBe('error-handler');
    });

    it('accepts custom options with reportToIssue: true', () => {
      const handler = new ErrorHandler(logger, { reportToIssue: true });
      expect(handler.name).toBe('error-handler');
    });
  });

  // ── wrap() — success path ─────────────────────────────────────

  describe('wrap() — success path', () => {
    it('returns a function', () => {
      const handler = new ErrorHandler(logger);
      const context = createEventContext();
      const fn = () => Promise.resolve('ok');

      const wrapped = handler.wrap(context, fn);
      expect(typeof wrapped).toBe('function');
    });

    it('executes the wrapped function and returns its result', async () => {
      const handler = new ErrorHandler(logger);
      const context = createEventContext();
      const fn = () => Promise.resolve(42);

      const wrapped = handler.wrap(context, fn);
      const result = await wrapped();

      expect(result).toBe(42);
    });

    it('executes the wrapped function with async result', async () => {
      const handler = new ErrorHandler(logger);
      const context = createEventContext();
      const fn = () => Promise.resolve({ summary: 'done', actionTaken: true });

      const wrapped = handler.wrap(context, fn);
      const result = await wrapped();

      expect(result).toEqual({ summary: 'done', actionTaken: true });
    });
  });

  // ── wrap() — AppError / recoverable ───────────────────────────

  describe('wrap() — known AppError (recoverable)', () => {
    it('catches the error and logs at WARN level', async () => {
      const handler = new ErrorHandler(logger);
      const context = createEventContext();

      // HandlerError is recoverable (recoverable = true)
      const cause = new Error('upstream timeout');
      const appError = new HandlerError('test-handler', cause);

      const fn = () => Promise.reject(appError);
      const wrapped = handler.wrap(context, fn);
      const result = await wrapped();

      expect(result).toBeUndefined();

      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('[HANDLER_ERROR]'),
        expect.objectContaining({
          event: 'issues.opened',
          repo: 'test-org/test-repo',
          deliveryId: 'delivery-xyz',
          recoverable: true,
        }),
      );
    });

    it('does not call logger.error for recoverable AppErrors', async () => {
      const handler = new ErrorHandler(logger);
      const context = createEventContext();
      const cause = new Error('timeout');
      const appError = new HandlerError('h', cause);

      const fn = () => Promise.reject(appError);
      const wrapped = handler.wrap(context, fn);
      await wrapped();

      expect(logger.error).not.toHaveBeenCalled();
    });
  });

  // ── wrap() — AppError / non-recoverable ───────────────────────

  describe('wrap() — known AppError (non-recoverable)', () => {
    it('catches the error and logs at WARN level', async () => {
      const handler = new ErrorHandler(logger);
      const context = createEventContext();

      // ConfigError is non-recoverable (recoverable = false)
      const appError = new ConfigError('Missing required config key');

      const fn = () => Promise.reject(appError);
      const wrapped = handler.wrap(context, fn);
      const result = await wrapped();

      expect(result).toBeUndefined();

      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('[CONFIG_ERROR]'),
        expect.objectContaining({
          recoverable: false,
        }),
      );
    });

    it('does not call logger.error for non-recoverable AppErrors', async () => {
      const handler = new ErrorHandler(logger);
      const context = createEventContext();
      const appError = new ConfigError('bad config');

      const fn = () => Promise.reject(appError);
      const wrapped = handler.wrap(context, fn);
      await wrapped();

      expect(logger.error).not.toHaveBeenCalled();
    });
  });

  // ── wrap() — unknown Error ────────────────────────────────────

  describe('wrap() — unknown Error (non-AppError)', () => {
    it('catches the error and logs at ERROR level', async () => {
      const handler = new ErrorHandler(logger);
      const context = createEventContext();

      const plainError = new Error('Something unexpected happened');

      const fn = () => Promise.reject(plainError);
      const wrapped = handler.wrap(context, fn);
      const result = await wrapped();

      expect(result).toBeUndefined();

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Unhandled error in event "issues.opened"'),
        plainError,
        expect.objectContaining({
          event: 'issues.opened',
          repo: 'test-org/test-repo',
          deliveryId: 'delivery-xyz',
        }),
      );
    });

    it('does not call logger.warn for unknown errors', async () => {
      const handler = new ErrorHandler(logger);
      const context = createEventContext();

      const fn = () => Promise.reject(new Error('boom'));
      const wrapped = handler.wrap(context, fn);
      await wrapped();

      expect(logger.warn).not.toHaveBeenCalled();
    });
  });

  // ── wrap() — non-Error thrown value ───────────────────────────

  describe('wrap() — raw string thrown (non-Error value)', () => {
    it('logs at ERROR level with a new Error wrapping the string', async () => {
      const handler = new ErrorHandler(logger);
      const context = createEventContext();

      const fn = () => Promise.reject('raw string error');
      const wrapped = handler.wrap(context, fn);
      const result = await wrapped();

      expect(result).toBeUndefined();

      expect(logger.error).toHaveBeenCalledTimes(1);
      const errArg = logger.error.mock.calls[0][1] as Error;
      expect(errArg).toBeInstanceOf(Error);
      expect(errArg.message).toBe('raw string error');
    });
  });

  // ── wrap() — reportToIssue option ─────────────────────────────

  describe('wrap() — reportToIssue option', () => {
    it('does not crash when reportToIssue is true and a non-recoverable AppError is thrown', async () => {
      const handler = new ErrorHandler(logger, { reportToIssue: true });
      const context = createEventContext();

      const appError = new ConfigError('Critical config error');

      const fn = () => Promise.reject(appError);
      const wrapped = handler.wrap(context, fn);
      const result = await wrapped();

      // The error is still caught and logged at WARN
      expect(result).toBeUndefined();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('[CONFIG_ERROR]'),
        expect.objectContaining({ recoverable: false }),
      );
    });
  });
});
