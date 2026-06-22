/**
 * YAML config provider — reads .github/gitbuddy.yml from the repository.
 *
 * Strategy pattern: the app uses IConfigProvider. Swap this for a database-backed
 * provider without changing any handler or service.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import YAML from 'yaml';
import { injectable } from 'inversify';
import type { IConfigProvider } from '../../core/interfaces.js';
import type { GitBuddyConfig } from '../../core/types.js';
import { ConfigNotFoundError, ConfigError } from '../../core/errors.js';

const CONFIG_FILE = '.github/gitbuddy.yml';
const FALLBACK_PATHS = [
  '.github/gitbuddy.yaml',
  'gitbuddy.yml',
  'gitbuddy.yaml',
];

@injectable()
export class YamlConfigProvider implements IConfigProvider {
  private config: GitBuddyConfig;
  private configPath: string | null = null;

  constructor(searchDir: string = process.cwd()) {
    this.config = this.load(searchDir);
  }

  getConfig(): GitBuddyConfig {
    return this.config;
  }

  get<T>(path: string, defaultValue: T): T {
    const keys = path.split('.');
    let current: unknown = this.config;
    for (const key of keys) {
      if (current === undefined || current === null) return defaultValue;
      current = (current as Record<string, unknown>)[key];
    }
    return (current as T) ?? defaultValue;
  }

  async reload(): Promise<void> {
    const dir = this.configPath ? path.dirname(this.configPath) : process.cwd();
    this.config = this.load(dir);
  }

  private load(searchDir: string): GitBuddyConfig {
    const filePath = this.findConfig(searchDir);
    if (!filePath) {
      throw new ConfigNotFoundError(
        `${CONFIG_FILE} not found. Tried: ${[searchDir, ...FALLBACK_PATHS].join(', ')}`,
      );
    }

    this.configPath = filePath;

    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = YAML.parse(raw);
      return this.applyDefaults(parsed ?? {});
    } catch (error) {
      throw new ConfigError(
        `Failed to parse ${filePath}: ${(error as Error).message}`,
      );
    }
  }

  private findConfig(searchDir: string): string | null {
    const candidates = [CONFIG_FILE, ...FALLBACK_PATHS];
    for (const candidate of candidates) {
      const fullPath = path.resolve(searchDir, candidate);
      if (fs.existsSync(fullPath)) return fullPath;
    }
    return null;
  }

  private applyDefaults(raw: Record<string, unknown>): GitBuddyConfig {
    return {
      governance: {
        autoBootstrapPatterns: [],
        requiredStatusChecks: [],
        requiredReviewCount: 1,
        ...((raw.governance as Record<string, unknown>) ?? {}),
      },
      automation: {
        defaultIssueLabels: [],
        labelRules: [],
        staleAfterDays: 60,
        closeAfterDays: 7,
        staleLabel: 'stale',
        ...((raw.automation as Record<string, unknown>) ?? {}),
      },
      security: {
        excludePatterns: [],
        maxPatAgeDays: 90,
        ...((raw.security as Record<string, unknown>) ?? {}),
      },
      sync: {
        downstreamRepos: {},
        integrations: [],
        ...((raw.sync as Record<string, unknown>) ?? {}),
      },
      insights: {
        collectDoraMetrics: false,
        ciHealthThreshold: 0.9,
        ...((raw.insights as Record<string, unknown>) ?? {}),
      },
      copilot: {
        prReviewEnabled: false,
        prDescriptionEnabled: false,
        maxTokens: 4096,
        ...((raw.copilot as Record<string, unknown>) ?? {}),
      },
    };
  }
}
