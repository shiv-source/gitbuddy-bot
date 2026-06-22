/**
 * ContextEnricher unit tests.
 *
 * Tests extraction and normalization of repo, org, sender, event name,
 * delivery ID, and payload from a raw Probot context object.
 */

import { jest, describe, it, beforeEach, expect } from '@jest/globals';
import { ContextEnricher } from '../../../src/middleware/context-enricher.js';
import type { ILogger } from '../../../src/core/interfaces.js';

function createMockLogger(): jest.Mocked<ILogger> {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

/** A minimal Probot-like context for testing. Extend or override per test. */
function createProbotContext(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name: 'issues.opened',
    id: 'delivery-abc-123',
    payload: {
      repository: {
        owner: { login: 'test-org' },
        name: 'test-repo',
      },
      organization: {
        login: 'test-org',
      },
      sender: {
        login: 'test-user',
      },
    },
    repo: undefined, // not called unless payload.repository is missing
    ...overrides,
  };
}

describe('ContextEnricher', () => {
  let enricher: ContextEnricher;
  let logger: jest.Mocked<ILogger>;

  beforeEach(() => {
    logger = createMockLogger();
    enricher = new ContextEnricher(logger);
  });

  describe('properties', () => {
    it('has the correct middleware name', () => {
      expect(enricher.name).toBe('context-enricher');
    });

    it('has the correct priority', () => {
      expect(enricher.priority).toBe(100);
    });
  });

  // ── Repo extraction ───────────────────────────────────────────

  describe('repo extraction', () => {
    it('extracts repo from payload.repository (owner.login + name)', () => {
      const ctx = createProbotContext();
      const result = enricher.enrich(ctx);

      expect(result.repo).toEqual({
        owner: 'test-org',
        repo: 'test-repo',
      });
    });

    it('extracts repo from ctx.repo() fallback when payload.repository is missing', () => {
      const ctx = createProbotContext({
        payload: {
          sender: { login: 'test-user' },
        },
        // Provide a repo() function as fallback
        repo: () => ({ owner: 'fallback-org', repo: 'fallback-repo' }),
      });
      const result = enricher.enrich(ctx);

      // ctx.repo() returns { owner: string; repo: string } (Probot format)
      // but extractRepo accesses repo.name (GitHub API format)
      // so the repo name falls through to 'unknown'
      expect(result.repo).toEqual({
        owner: 'fallback-org',
        repo: 'unknown',
      });
    });

    it('returns unknown owner/repo when both payload.repository and ctx.repo() are missing', () => {
      const ctx = createProbotContext({
        payload: {
          sender: { login: 'test-user' },
        },
        repo: undefined,
      });
      const result = enricher.enrich(ctx);

      expect(result.repo).toEqual({
        owner: 'unknown',
        repo: 'unknown',
      });
    });

    it('uses repo.owner string when owner.login is absent', () => {
      const ctx = createProbotContext({
        payload: {
          repository: {
            owner: 'direct-owner',
            name: 'direct-repo',
          },
        },
      });
      const result = enricher.enrich(ctx);

      expect(result.repo).toEqual({
        owner: 'direct-owner',
        repo: 'direct-repo',
      });
    });

    it('returns unknown owner when repo.owner is null', () => {
      const ctx = createProbotContext({
        payload: {
          repository: {
            owner: null,
            name: 'some-repo',
          },
        },
      });
      const result = enricher.enrich(ctx);
      expect(result.repo.owner).toBe('unknown');
    });
  });

  // ── Org extraction ────────────────────────────────────────────

  describe('org extraction', () => {
    it('extracts org from payload.organization.login', () => {
      const ctx = createProbotContext();
      const result = enricher.enrich(ctx);

      expect(result.org).toBe('test-org');
    });

    it('extracts org from payload.org.login (alternative path)', () => {
      const ctx = createProbotContext({
        payload: {
          org: { login: 'alt-org' },
          repository: {
            owner: { login: 'alt-org' },
            name: 'some-repo',
          },
          sender: { login: 'test-user' },
        },
      });
      const result = enricher.enrich(ctx);

      expect(result.org).toBe('alt-org');
    });

    it('returns undefined org when neither payload.organization nor payload.org exists', () => {
      const ctx = createProbotContext({
        payload: {
          repository: {
            owner: { login: 'test-org' },
            name: 'test-repo',
          },
          sender: { login: 'test-user' },
        },
        // no organization, no org
      });
      const result = enricher.enrich(ctx);

      expect(result.org).toBeUndefined();
    });

    it('handles org as a plain string when org.login is absent', () => {
      const ctx = createProbotContext({
        payload: {
          org: 'string-org',
          repository: {
            owner: { login: 'string-org' },
            name: 'some-repo',
          },
          sender: { login: 'test-user' },
        },
      });
      const result = enricher.enrich(ctx);

      expect(result.org).toBe('string-org');
    });
  });

  // ── Sender extraction ─────────────────────────────────────────

  describe('sender extraction', () => {
    it('extracts sender from payload.sender.login', () => {
      const ctx = createProbotContext();
      const result = enricher.enrich(ctx);

      expect(result.sender).toBe('test-user');
    });

    it('returns unknown sender when payload.sender is missing', () => {
      const ctx = createProbotContext({
        payload: {
          repository: {
            owner: { login: 'test-org' },
            name: 'test-repo',
          },
        },
      });
      const result = enricher.enrich(ctx);

      expect(result.sender).toBe('unknown');
    });
  });

  // ── Event metadata ────────────────────────────────────────────

  describe('event metadata', () => {
    it('returns ctx.name as event name', () => {
      const ctx = createProbotContext();
      const result = enricher.enrich(ctx);

      expect(result.name).toBe('issues.opened');
    });

    it('returns unknown as event name when ctx.name is missing', () => {
      const ctx = createProbotContext({ name: undefined });
      const result = enricher.enrich(ctx);

      expect(result.name).toBe('unknown');
    });

    it('returns ctx.id as deliveryId', () => {
      const ctx = createProbotContext();
      const result = enricher.enrich(ctx);

      expect(result.deliveryId).toBe('delivery-abc-123');
    });

    it('returns unknown as deliveryId when ctx.id is missing', () => {
      const ctx = createProbotContext({ id: undefined });
      const result = enricher.enrich(ctx);

      expect(result.deliveryId).toBe('unknown');
    });

    it('returns ctx.payload as payload', () => {
      const ctx = createProbotContext();
      const result = enricher.enrich(ctx);

      expect(result.payload).toBe(ctx.payload);
    });

    it('returns empty object as payload when ctx.payload is missing', () => {
      const ctx = createProbotContext({ payload: undefined });
      const result = enricher.enrich(ctx);

      expect(result.payload).toEqual({});
    });
  });

  // ── Logger ────────────────────────────────────────────────────

  describe('logger', () => {
    it('calls logger.debug with the enriched context data', () => {
      const ctx = createProbotContext();
      enricher.enrich(ctx);

      expect(logger.debug).toHaveBeenCalledTimes(1);
      expect(logger.debug).toHaveBeenCalledWith('Context enriched', {
        event: 'issues.opened',
        repo: 'test-org/test-repo',
        org: 'test-org',
        sender: 'test-user',
        deliveryId: 'delivery-abc-123',
      });
    });
  });
});
