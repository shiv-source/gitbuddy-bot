/**
 * OctokitClientFactory unit tests.
 *
 * Tests that the factory creates OctokitClient instances wrapping the
 * provided octokit object.
 */

import { jest, describe, it, expect } from '@jest/globals';
import { OctokitClientFactory } from '../../../src/infrastructure/github/octokit-factory.js';
import { OctokitClient } from '../../../src/infrastructure/github/octokit-client.js';
import type { IGitHubClient } from '../../../src/core/interfaces.js';

describe('OctokitClientFactory', () => {
  // ── create ───────────────────────────────────────────────────

  describe('create', () => {
    it('returns an IGitHubClient instance', () => {
      const factory = new OctokitClientFactory();
      const mockOctokit = { rest: {} };
      const client = factory.create(mockOctokit);

      // Verify it implements the IGitHubClient interface by checking
      // all required methods exist
      expect(client).toBeDefined();
      expect(typeof client.getRepo).toBe('function');
      expect(typeof client.createIssueComment).toBe('function');
      expect(typeof client.addLabels).toBe('function');
      expect(typeof client.removeLabel).toBe('function');
      expect(typeof client.getPullRequest).toBe('function');
      expect(typeof client.requestReviewers).toBe('function');
      expect(typeof client.createPRComment).toBe('function');
      expect(typeof client.getBranchProtection).toBe('function');
      expect(typeof client.updateBranchProtection).toBe('function');
      expect(typeof client.getTeamMembers).toBe('function');
      expect(typeof client.dispatchWorkflow).toBe('function');
      expect(typeof client.createCheckRun).toBe('function');
      expect(typeof client.searchRepos).toBe('function');
      expect(typeof client.searchIssues).toBe('function');
      expect(typeof client.updateIssue).toBe('function');
    });

    it('returns an OctokitClient instance', () => {
      const factory = new OctokitClientFactory();
      const mockOctokit = { rest: {} };
      const client = factory.create(mockOctokit);

      expect(client).toBeInstanceOf(OctokitClient);
    });

    it('wraps the passed octokit so methods use it', async () => {
      const factory = new OctokitClientFactory();
      const mockOctokit = {
        rest: {
          repos: {
            get: jest.fn<() => Promise<{ data: { owner: { login: string }; name: string; default_branch: string; private: boolean; archived: boolean } }>>()
              .mockResolvedValue({
                data: {
                  owner: { login: 'test-owner' },
                  name: 'test-repo',
                  default_branch: 'main',
                  private: false,
                  archived: false,
                },
              }),
          },
        },
      };

      const client = factory.create(mockOctokit) as IGitHubClient;
      const repo = await client.getRepo('test-owner', 'test-repo');

      expect(repo.owner).toBe('test-owner');
      expect(repo.repo).toBe('test-repo');
      expect(mockOctokit.rest.repos.get).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
      });
    });

    it('creates independent instances for each call', () => {
      const factory = new OctokitClientFactory();
      const octokitA = { rest: {} };
      const octokitB = { rest: {} };

      const clientA = factory.create(octokitA);
      const clientB = factory.create(octokitB);

      expect(clientA).toBeInstanceOf(OctokitClient);
      expect(clientB).toBeInstanceOf(OctokitClient);
      expect(clientA).not.toBe(clientB);
    });
  });
});
