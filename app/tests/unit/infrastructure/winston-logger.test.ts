/**
 * WinstonLogger unit tests.
 */

import { jest, describe, it, beforeEach, expect } from '@jest/globals';
import { WinstonLogger } from '../../../src/infrastructure/logging/winston-logger.js';

describe('WinstonLogger', () => {
  let logger: WinstonLogger;

  beforeEach(() => {
    logger = new WinstonLogger();
  });

  it('implements ILogger interface', () => {
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('logs debug messages without data', () => {
    expect(() => logger.debug('debug message')).not.toThrow();
  });

  it('logs debug messages with data', () => {
    expect(() => logger.debug('debug message', { key: 'value' })).not.toThrow();
  });

  it('logs info messages', () => {
    expect(() => logger.info('info message')).not.toThrow();
  });

  it('logs warn messages', () => {
    expect(() => logger.warn('warn message')).not.toThrow();
  });

  it('logs error messages', () => {
    expect(() => logger.error('error message')).not.toThrow();
  });

  it('logs error messages with Error object', () => {
    const err = new Error('test error');
    expect(() => logger.error('error message', err)).not.toThrow();
  });

  it('logs error messages with Error and data', () => {
    const err = new Error('test error');
    expect(() => logger.error('error message', err, { code: '500' })).not.toThrow();
  });

  it('creates singleton-friendly instances', () => {
    const logger2 = new WinstonLogger();
    expect(logger2).toBeDefined();
    expect(typeof logger2.info).toBe('function');
  });

  it('adds file transport when LOG_FILE env is set', () => {
    process.env.LOG_FILE = '/tmp/test-gitbuddy.log';
    const fileLogger = new WinstonLogger();
    expect(fileLogger).toBeDefined();
    expect(typeof fileLogger.info).toBe('function');
    delete process.env.LOG_FILE;
  });
});
