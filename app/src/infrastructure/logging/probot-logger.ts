/**
 * Probot Logger adapter — implements ILogger using Probot's built-in pino logger.
 *
 * Adapter pattern: the app depends on ILogger, not on Probot's Logger directly.
 * Pino log methods take (obj, message) — we adapt our ILogger to that convention.
 */

import type { ILogger } from '../../core/interfaces.js';

export interface ProbotLogFn {
  (obj: Record<string, unknown>, message: string): void;
  (message: string): void;
}

export interface ProbotLog {
  debug: ProbotLogFn;
  info: ProbotLogFn;
  warn: ProbotLogFn;
  error: ProbotLogFn;
}

export class ProbotLogger implements ILogger {
  constructor(private readonly log: ProbotLog) {}

  debug(message: string, data?: Record<string, unknown>): void {
    this.log.debug(data ?? {}, message);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log.info(data ?? {}, message);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log.warn(data ?? {}, message);
  }

  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.log.error({ ...data, error: error?.message, stack: error?.stack }, message);
  }
}
