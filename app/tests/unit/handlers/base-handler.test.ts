/**
 * BaseHandler unit tests — exercises the Template Method pipeline
 * and error handling paths.
 */

import { jest, describe, it, expect } from '@jest/globals';
import { BaseHandler } from '../../../src/handlers/base-handler.js';
import type { ILogger, IConfigProvider } from '../../../src/core/interfaces.js';
import type { EventContext, HandlerResult } from '../../../src/core/types.js';
import { HandlerError, ValidationError } from '../../../src/core/errors.js';
import { NO_ACTION } from '../../../src/core/types.js';

function createMockLogger(): ILogger {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

function createMockConfig(): jest.Mocked<IConfigProvider> {
  return {
    getConfig: jest.fn(),
    get: jest.fn((_path: string, defaultValue: unknown) => defaultValue),
    reload: jest.fn(),
  } as unknown as jest.Mocked<IConfigProvider>;
}

function createContext(overrides: Partial<EventContext> = {}): EventContext {
  return {
    name: 'test.event',
    deliveryId: 'test-1',
    payload: {},
    repo: { owner: 'test-org', repo: 'test-repo' },
    sender: 'test-user',
    octokit: {} as any,
    ...overrides,
  };
}

describe('BaseHandler', () => {
  // Concrete subclass for testing
  class TestHandler extends BaseHandler {
    readonly name = 'test';
    readonly events = ['test.event'];

    protected async process(context: EventContext): Promise<HandlerResult> {
      return { summary: 'processed', actionTaken: true };
    }
  }

  // Subclass that overrides validate to throw
  class ValidatingHandler extends BaseHandler {
    readonly name = 'validating';
    readonly events = ['test.event'];

    protected validate(context: EventContext): void {
      if (!context.payload || Object.keys(context.payload as object).length === 0) {
        throw new ValidationError('payload required');
      }
    }

    protected async process(context: EventContext): Promise<HandlerResult> {
      return { summary: 'processed', actionTaken: true };
    }
  }

  // Subclass that throws in process
  class FailingHandler extends BaseHandler {
    readonly name = 'failing';
    readonly events = ['test.event'];

    protected async process(_context: EventContext): Promise<HandlerResult> {
      throw new Error('something went wrong');
    }
  }

  // Subclass that overrides enrich
  class EnrichingHandler extends BaseHandler {
    readonly name = 'enriching';
    readonly events = ['test.event'];

    protected async enrich(context: EventContext): Promise<EventContext> {
      return { ...context, sender: 'enriched-sender' };
    }

    protected async process(context: EventContext): Promise<HandlerResult> {
      expect(context.sender).toBe('enriched-sender');
      return { summary: 'enriched', actionTaken: true };
    }
  }

  // Subclass that overrides respond
  class RespondingHandler extends BaseHandler {
    readonly name = 'responding';
    readonly events = ['test.event'];

    protected async process(_context: EventContext): Promise<HandlerResult> {
      return { summary: 'with response', actionTaken: true };
    }

    protected async respond(context: EventContext, _result: HandlerResult): Promise<void> {
      // Custom response logic
    }
  }

  it('executes process for a valid context', async () => {
    const handler = new TestHandler(createMockLogger(), createMockConfig());
    const context = createContext();
    const result = await handler.handle(context);
    expect(result.actionTaken).toBe(true);
    expect(result.summary).toBe('processed');
  });

  it('throws HandlerError when process throws', async () => {
    const handler = new FailingHandler(createMockLogger(), createMockConfig());
    const context = createContext();
    await expect(handler.handle(context)).rejects.toThrow(HandlerError);
    await expect(handler.handle(context)).rejects.toThrow('something went wrong');
  });

  it('throws ValidationError from validate hook', async () => {
    const handler = new ValidatingHandler(createMockLogger(), createMockConfig());
    const context = createContext({ payload: {} });
    await expect(handler.handle(context)).rejects.toThrow(HandlerError);
    await expect(handler.handle(context)).rejects.toThrow('payload required');
  });

  it('calls enrich before process', async () => {
    const handler = new EnrichingHandler(createMockLogger(), createMockConfig());
    const context = createContext();
    const result = await handler.handle(context);
    expect(result.summary).toBe('enriched');
  });

  it('calls respond after process', async () => {
    const handler = new RespondingHandler(createMockLogger(), createMockConfig());
    const context = createContext();
    const result = await handler.handle(context);
    expect(result.actionTaken).toBe(true);
  });

  it('validating handler passes when payload is non-empty', async () => {
    const handler = new ValidatingHandler(createMockLogger(), createMockConfig());
    const context = createContext({ payload: { key: 'value' } });
    const result = await handler.handle(context);
    expect(result.actionTaken).toBe(true);
  });

  it('wraps non-Error throws in HandlerError', async () => {
    // Subclass that throws a string (not an Error instance)
    class StringThrowingHandler extends BaseHandler {
      readonly name = 'string-thrower';
      readonly events = ['test.event'];
      protected async process(_context: EventContext): Promise<HandlerResult> {
        throw 'raw string error';
      }
    }

    const handler = new StringThrowingHandler(createMockLogger(), createMockConfig());
    const context = createContext();
    await expect(handler.handle(context)).rejects.toThrow(HandlerError);
    await expect(handler.handle(context)).rejects.toThrow('raw string error');
  });
});
