/**
 * Winston Logger adapter — implements ILogger using Winston.
 *
 * Adapter pattern: the app depends on ILogger, not on Winston directly.
 * Swap this for any other logging library by changing the container binding.
 *
 * Transports:
 *   - Console: colorized, human-readable output for development
 *   - File: JSON lines for production (rotated by external log management)
 *
 * Log levels: error (0), warn (1), info (2), debug (3)
 */

import winston from 'winston';
import { injectable } from 'inversify';
import type { ILogger } from '../../core/interfaces.js';

@injectable()
export class WinstonLogger implements ILogger {
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL ?? 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { service: 'gitbuddy-bot' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: 'HH:mm:ss' }),
            winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
              const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
              return `${timestamp} ${level}: ${message}${metaStr}`;
            }),
          ),
        }),
      ],
    });

    // Write to file in production
    if (process.env.LOG_FILE) {
      this.logger.add(
        new winston.transports.File({
          filename: process.env.LOG_FILE,
          maxsize: 10 * 1024 * 1024, // 10 MB
          maxFiles: 5,
        }),
      );
    }
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.logger.debug(message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.logger.info(message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.logger.warn(message, data);
  }

  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.logger.error(message, { ...data, error: error?.message, stack: error?.stack });
  }
}
