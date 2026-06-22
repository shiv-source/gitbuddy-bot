/**
 * DI Container unit tests.
 *
 * Verifies the InversifyJS container resolves all types correctly,
 * middleware priorities are ordered, and bindings are complete.
 */

import { describe, it, expect, beforeAll, jest } from '@jest/globals';
import { container } from '../../../src/di/container.js';
import { TYPES } from '../../../src/di/types.js';
import type {
  ILogger,
  IConfigProvider,
  ICache,
  ICommandRouter,
  IStaleService,
  IMiddleware,
  IOctokitClientFactory,
  GitBuddyConfig,
} from '../../../src/core/interfaces.js';
import type { IEventHandler, ICommand } from '../../../src/core/interfaces.js';

beforeAll(() => {
  // Bind Probot-provided value that would normally come from createApp()
  if (!container.isBound(TYPES.Probot)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    container.bind(TYPES.Probot).toConstantValue({ on: () => {} } as any);
  }
  // Override ConfigProvider binding with an in-memory mock so tests don't
  // need a .github/gitbuddy.yml file on disk.
  container.rebind<IConfigProvider>(TYPES.ConfigProvider).toConstantValue({
    getConfig: jest.fn<() => GitBuddyConfig>().mockReturnValue({} as GitBuddyConfig),
    get: jest.fn(<T,>(_path: string, defaultValue: T) => defaultValue),
    reload: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  });
});

describe('DI Container', () => {
  // ── Infrastructure ──────────────────────────────────────────
  it('resolves Logger', () => {
    const logger = container.get<ILogger>(TYPES.Logger);
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('resolves ConfigProvider as singleton', () => {
    const config1 = container.get<IConfigProvider>(TYPES.ConfigProvider);
    const config2 = container.get<IConfigProvider>(TYPES.ConfigProvider);
    expect(config1).toBe(config2);
  });

  it('resolves Cache as singleton', () => {
    const cache1 = container.get<ICache>(TYPES.Cache);
    const cache2 = container.get<ICache>(TYPES.Cache);
    expect(cache1).toBe(cache2);
  });

  it('resolves OctokitClientFactory', () => {
    const factory = container.get<IOctokitClientFactory>(TYPES.OctokitClientFactory);
    expect(factory).toBeDefined();
    expect(typeof factory.create).toBe('function');
  });

  // ── Middleware ──────────────────────────────────────────────
  it('resolves all 3 middlewares', () => {
    const middlewares = container.getAll<IMiddleware>(TYPES.Middleware);
    expect(middlewares).toHaveLength(3);
  });

  it('middlewares have correct priorities (100 < 200 < 300)', () => {
    const middlewares = container.getAll<IMiddleware>(TYPES.Middleware);
    const sorted = [...middlewares].sort((a, b) => a.priority - b.priority);

    expect(sorted[0].name).toBe('context-enricher');
    expect(sorted[0].priority).toBe(100);

    expect(sorted[1].name).toBe('rate-limiter');
    expect(sorted[1].priority).toBe(200);

    expect(sorted[2].name).toBe('error-handler');
    expect(sorted[2].priority).toBe(300);

    // Verify strict ordering
    expect(sorted[0].priority).toBeLessThan(sorted[1].priority);
    expect(sorted[1].priority).toBeLessThan(sorted[2].priority);
  });

  it('ContextEnricher priority < RateLimiter priority < ErrorHandler priority', () => {
    const all = container.getAll<IMiddleware>(TYPES.Middleware);
    const find = (name: string) => all.find((m) => m.name === name)!;

    expect(find('context-enricher').priority).toBeLessThan(find('rate-limiter').priority);
    expect(find('rate-limiter').priority).toBeLessThan(find('error-handler').priority);
  });

  // ── Handlers ───────────────────────────────────────────────
  it('resolves all 7 handlers', () => {
    const handlers = container.getAll<IEventHandler>(TYPES.Handler);
    expect(handlers).toHaveLength(7);

    const names = handlers.map((h) => h.name).sort();
    expect(names).toEqual([
      'automation',
      'copilot',
      'governance',
      'insights',
      'security',
      'stale',
      'sync',
    ]);
  });

  // ── Commands ───────────────────────────────────────────────
  it('resolves all 3 commands', () => {
    const commands = container.getAll<ICommand>(TYPES.Command);
    expect(commands).toHaveLength(3);

    const names = commands.map((c) => c.name).sort();
    expect(names).toEqual(['label', 'shipit', 'triage']);
  });

  it('resolves CommandRouter with commands auto-registered', () => {
    const router = container.get<ICommandRouter>(TYPES.CommandRouter);
    expect(router).toBeDefined();

    const cmdList = router.listCommands();
    expect(cmdList).toHaveLength(3);

    const names = cmdList.map((c) => c.name).sort();
    expect(names).toEqual(['label', 'shipit', 'triage']);
  });

  // ── Services ───────────────────────────────────────────────
  it('resolves StaleService via IStaleService', () => {
    const service = container.get<IStaleService>(TYPES.StaleService);
    expect(service).toBeDefined();
    expect(typeof service.sweepRepo).toBe('function');
    expect(typeof service.sweepOrg).toBe('function');
  });

  it('StaleService is singleton', () => {
    const s1 = container.get<IStaleService>(TYPES.StaleService);
    const s2 = container.get<IStaleService>(TYPES.StaleService);
    expect(s1).toBe(s2);
  });
});
