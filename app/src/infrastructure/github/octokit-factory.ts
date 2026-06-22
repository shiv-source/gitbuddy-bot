/**
 * OctokitClientFactory — creates IGitHubClient instances per webhook event.
 *
 * Probot provides an installation-scoped Octokit on each webhook delivery.
 * This factory wraps that per-event Octokit in our domain adapter (OctokitClient).
 * This is the ONLY place outside of container.ts where `new` is called for an
 * injectable class — per requirement #15.
 */

import { injectable } from 'inversify';
import type { IGitHubClient, IOctokitClientFactory } from '../../core/interfaces.js';
import { OctokitClient } from './octokit-client.js';

@injectable()
export class OctokitClientFactory implements IOctokitClientFactory {
  create(octokit: unknown): IGitHubClient {
    return new OctokitClient(octokit);
  }
}
