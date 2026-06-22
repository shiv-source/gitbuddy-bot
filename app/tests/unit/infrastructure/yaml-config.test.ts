/**
 * YamlConfigProvider unit tests.
 *
 * Uses temp directories with real filesystem I/O to test config loading,
 * fallback paths, error handling, and the dot-notation get() method.
 */

import { jest, describe, it, beforeEach, afterEach, expect } from '@jest/globals';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { YamlConfigProvider } from '../../../src/infrastructure/config/yaml-config.js';
import { ConfigNotFoundError, ConfigError } from '../../../src/core/errors.js';
import type { GitBuddyConfig } from '../../../src/core/types.js';

// ── Helpers ────────────────────────────────────────────────────

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'yaml-config-test-'));
}

function writeYml(dir: string, relativePath: string, content: string): string {
  const fullPath = path.resolve(dir, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf-8');
  return fullPath;
}

function rmDir(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

process.chdir('/'); // ensure no accidental cwd contamination; tests use explicit searchDir

// ── Tests ──────────────────────────────────────────────────────

describe('YamlConfigProvider', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    rmDir(tmpDir);
  });

  // ── Constructor: missing config ──────────────────────────────

  describe('constructor — missing config', () => {
    it('throws ConfigNotFoundError when no config file exists', () => {
      expect(() => new YamlConfigProvider(tmpDir)).toThrow(ConfigNotFoundError);
    });

    it('throws ConfigNotFoundError with a descriptive message', () => {
      expect(() => new YamlConfigProvider(tmpDir)).toThrow(
        /\.github\/gitbuddy\.yml not found/,
      );
    });

    it('throws ConfigNotFoundError when the directory does not exist', () => {
      const nonExistent = path.join(tmpDir, 'does-not-exist');
      expect(() => new YamlConfigProvider(nonExistent)).toThrow(ConfigNotFoundError);
    });

    it('uses process.cwd() as default searchDir when no argument is given', () => {
      // process.chdir('/') was called at module level, so the provider
      // will search from /, which has no config — should throw.
      expect(() => new YamlConfigProvider()).toThrow(ConfigNotFoundError);
    });
  });

  // ── Constructor: valid config ────────────────────────────────

  describe('constructor — valid config', () => {
    it('reads and parses a valid .github/gitbuddy.yml', () => {
      const configYml = [
        'governance:',
        '  autoBootstrapPatterns:',
        '    - "repo-*"',
        '  requiredReviewCount: 2',
        'automation:',
        '  staleLabel: "inactive"',
      ].join('\n');

      writeYml(tmpDir, '.github/gitbuddy.yml', configYml);
      const provider = new YamlConfigProvider(tmpDir);
      const config = provider.getConfig();

      expect(config.governance?.autoBootstrapPatterns).toEqual(['repo-*']);
      expect(config.governance?.requiredReviewCount).toBe(2);
      expect(config.automation?.staleLabel).toBe('inactive');
    });

    it('applies defaults for sections not present in YAML', () => {
      const configYml = 'governance:\n  autoBootstrapPatterns: ["my-pattern"]\n';
      writeYml(tmpDir, '.github/gitbuddy.yml', configYml);

      const provider = new YamlConfigProvider(tmpDir);
      const config = provider.getConfig();

      // From YAML
      expect(config.governance?.autoBootstrapPatterns).toEqual(['my-pattern']);
      // Defaults
      expect(config.governance?.requiredReviewCount).toBe(1);
      expect(config.governance?.requiredStatusChecks).toEqual([]);
      expect(config.automation?.staleAfterDays).toBe(60);
      expect(config.automation?.staleLabel).toBe('stale');
      expect(config.automation?.closeAfterDays).toBe(7);
      expect(config.automation?.defaultIssueLabels).toEqual([]);
      expect(config.security?.excludePatterns).toEqual([]);
      expect(config.security?.maxPatAgeDays).toBe(90);
      expect(config.sync?.downstreamRepos).toEqual({});
      expect(config.sync?.integrations).toEqual([]);
      expect(config.insights?.collectDoraMetrics).toBe(false);
      expect(config.insights?.ciHealthThreshold).toBe(0.9);
      expect(config.copilot?.prReviewEnabled).toBe(false);
      expect(config.copilot?.prDescriptionEnabled).toBe(false);
      expect(config.copilot?.maxTokens).toBe(4096);
    });

    it('returns the full config via getConfig()', () => {
      const configYml = 'automation:\n  staleAfterDays: 45\n';
      writeYml(tmpDir, '.github/gitbuddy.yml', configYml);

      const provider = new YamlConfigProvider(tmpDir);
      const config = provider.getConfig();

      expect(config).toBeDefined();
      expect(config.automation?.staleAfterDays).toBe(45);
    });

    it('handles an empty YAML file', () => {
      writeYml(tmpDir, '.github/gitbuddy.yml', '');
      const provider = new YamlConfigProvider(tmpDir);
      const config = provider.getConfig();

      // YAML.parse('') returns null, which becomes null, then ?? {} → {}
      // All defaults should be applied
      expect(config.governance?.requiredReviewCount).toBe(1);
      expect(config.automation?.staleAfterDays).toBe(60);
    });
  });

  // ── Fallback paths ──────────────────────────────────────────

  describe('fallback config paths', () => {
    it('reads .github/gitbuddy.yaml when .yml is absent', () => {
      writeYml(tmpDir, '.github/gitbuddy.yaml', 'automation:\n  staleLabel: "custom-stale"\n');
      const provider = new YamlConfigProvider(tmpDir);
      expect(provider.getConfig().automation?.staleLabel).toBe('custom-stale');
    });

    it('reads gitbuddy.yml when .github/ variants are absent', () => {
      writeYml(tmpDir, 'gitbuddy.yml', 'automation:\n  staleLabel: "root-label"\n');
      const provider = new YamlConfigProvider(tmpDir);
      expect(provider.getConfig().automation?.staleLabel).toBe('root-label');
    });

    it('reads gitbuddy.yaml as the last fallback', () => {
      writeYml(tmpDir, 'gitbuddy.yaml', 'automation:\n  staleLabel: "root-yaml-label"\n');
      const provider = new YamlConfigProvider(tmpDir);
      expect(provider.getConfig().automation?.staleLabel).toBe('root-yaml-label');
    });

    it('prefers .github/gitbuddy.yml over all fallbacks', () => {
      writeYml(tmpDir, '.github/gitbuddy.yml', 'automation:\n  staleLabel: "preferred"\n');
      writeYml(tmpDir, '.github/gitbuddy.yaml', 'automation:\n  staleLabel: "fallback1"\n');
      writeYml(tmpDir, 'gitbuddy.yml', 'automation:\n  staleLabel: "fallback2"\n');

      const provider = new YamlConfigProvider(tmpDir);
      expect(provider.getConfig().automation?.staleLabel).toBe('preferred');
    });

    it('prefers .github/gitbuddy.yaml over repo-root variants', () => {
      writeYml(tmpDir, '.github/gitbuddy.yaml', 'automation:\n  staleLabel: "dot-github"\n');
      writeYml(tmpDir, 'gitbuddy.yml', 'automation:\n  staleLabel: "root-yml"\n');
      writeYml(tmpDir, 'gitbuddy.yaml', 'automation:\n  staleLabel: "root-yaml"\n');

      const provider = new YamlConfigProvider(tmpDir);
      expect(provider.getConfig().automation?.staleLabel).toBe('dot-github');
    });
  });

  // ── Custom searchDir ─────────────────────────────────────────

  describe('custom searchDir parameter', () => {
    it('accepts an explicit searchDir argument', () => {
      writeYml(tmpDir, '.github/gitbuddy.yml', 'governance:\n  requiredReviewCount: 3\n');
      const provider = new YamlConfigProvider(tmpDir);
      expect(provider.getConfig().governance?.requiredReviewCount).toBe(3);
    });
  });

  // ── get() — dot-notation access ─────────────────────────────

  describe('get()', () => {
    const configYml = [
      'governance:',
      '  autoBootstrapPatterns:',
      '    - "pattern-a"',
      '  requiredReviewCount: 3',
      'automation:',
      '  staleLabel: "stale-custom"',
      '  staleAfterDays: 30',
      '  labelRules:',
      '    - pattern: ".*"',
      '      label: "auto"',
      'security:',
      '  null:',
    ].join('\n');

    beforeEach(() => {
      writeYml(tmpDir, '.github/gitbuddy.yml', configYml);
    });

    it('returns a nested string value by dot notation', () => {
      const provider = new YamlConfigProvider(tmpDir);
      expect(provider.get<string>('automation.staleLabel', '')).toBe('stale-custom');
    });

    it('returns a nested number value', () => {
      const provider = new YamlConfigProvider(tmpDir);
      expect(provider.get<number>('governance.requiredReviewCount', 1)).toBe(3);
    });

    it('returns a nested array value', () => {
      const provider = new YamlConfigProvider(tmpDir);
      expect(provider.get<string[]>('governance.autoBootstrapPatterns', [])).toEqual(['pattern-a']);
    });

    it('returns a nested object value', () => {
      const provider = new YamlConfigProvider(tmpDir);
      const rules = provider.get<Array<{ pattern: string; label: string }>>('automation.labelRules', []);
      expect(rules).toEqual([{ pattern: '.*', label: 'auto' }]);
    });

    it('returns the default value when the path does not exist', () => {
      const provider = new YamlConfigProvider(tmpDir);
      expect(provider.get<string>('nonexistent.path', 'fallback')).toBe('fallback');
    });

    it('returns the default value when the path is only partially present', () => {
      const provider = new YamlConfigProvider(tmpDir);
      expect(provider.get<string>('governance.deeply.nested', 'default')).toBe('default');
    });

    it('returns default for completely missing top-level key', () => {
      const provider = new YamlConfigProvider(tmpDir);
      expect(provider.get<string>('nosuchkey.value', 'defaultValue')).toBe('defaultValue');
    });

    it('returns the default when the stored value is null (?? operator)', () => {
      const configYml = 'someKey: null\n';
      writeYml(tmpDir, '.github/gitbuddy.yml', configYml);
      const provider = new YamlConfigProvider(tmpDir);
      // The key exists but is null — null ?? defaultValue = defaultValue
      expect(provider.get('someKey', 'default')).toBe('default');
    });

    it('returns default when path leads to a null intermediate (early return in loop)', () => {
      // Create a config where an intermediate is explicitly null
      const yml = 'governance:\n  requiredReviewCount: 2\ncustomSection: null\n';
      writeYml(tmpDir, '.github/gitbuddy.yml', yml);
      const provider = new YamlConfigProvider(tmpDir);
      // customSection exists but is null — in the loop, current becomes null,
      // so we return defaultValue early
      const result = provider.get('customSection.nestedValue', 'fallback-for-null');
      expect(result).toBe('fallback-for-null');
    });

    it('returns default when a later intermediate goes missing', () => {
      // An intermediate key is missing altogether — undefined triggers
      // the early return
      const yml = 'sectionA:\n  subKey: "value"\n';
      writeYml(tmpDir, '.github/gitbuddy.yml', yml);
      const provider = new YamlConfigProvider(tmpDir);
      const result = provider.get('sectionA.missing.nested', 'intermediate-default');
      expect(result).toBe('intermediate-default');
    });
  });

  // ── reload ───────────────────────────────────────────────────

  describe('reload()', () => {
    it('re-reads the config from disk', async () => {
      writeYml(tmpDir, '.github/gitbuddy.yml', 'automation:\n  staleLabel: "original"\n');
      const provider = new YamlConfigProvider(tmpDir);
      expect(provider.get<string>('automation.staleLabel', '')).toBe('original');

      // Change file and reload
      writeYml(tmpDir, '.github/gitbuddy.yml', 'automation:\n  staleLabel: "updated"\n');
      await provider.reload();

      expect(provider.get<string>('automation.staleLabel', '')).toBe('updated');
    });

    it('returns the same config object shape after reload', async () => {
      writeYml(tmpDir, '.github/gitbuddy.yml', 'governance:\n  requiredReviewCount: 2\n');
      const provider = new YamlConfigProvider(tmpDir);

      writeYml(tmpDir, '.github/gitbuddy.yml', 'governance:\n  requiredReviewCount: 5\n');
      await provider.reload();

      const config = provider.getConfig();
      expect(config.governance?.requiredReviewCount).toBe(5);
      // Defaults still applied
      expect(config.governance?.requiredStatusChecks).toEqual([]);
    });

    it('throws if the config file was removed before reload', async () => {
      writeYml(tmpDir, '.github/gitbuddy.yml', 'automation:\n  staleLabel: "original"\n');
      const provider = new YamlConfigProvider(tmpDir);

      // Remove the file
      fs.rmSync(path.resolve(tmpDir, '.github/gitbuddy.yml'));
      fs.rmSync(path.resolve(tmpDir, '.github'), { recursive: true, force: true });

      await expect(provider.reload()).rejects.toThrow(ConfigNotFoundError);
    });

    it('uses the searchDir from the originally found config path', async () => {
      writeYml(tmpDir, 'gitbuddy.yml', 'automation:\n  staleLabel: "root-config"\n');
      const provider = new YamlConfigProvider(tmpDir);

      // Change the root file
      writeYml(tmpDir, 'gitbuddy.yml', 'automation:\n  staleLabel: "reloaded-root"\n');
      await provider.reload();

      expect(provider.get<string>('automation.staleLabel', '')).toBe('reloaded-root');
    });
  });

  // ── Parse error handling ─────────────────────────────────────

  describe('parse error handling', () => {
    it('throws ConfigError for invalid YAML', () => {
      writeYml(tmpDir, '.github/gitbuddy.yml', 'invalid: [yaml: broken\n  - unclosed');
      expect(() => new YamlConfigProvider(tmpDir)).toThrow(ConfigError);
    });

    it('throws ConfigError with a descriptive message including the file path', () => {
      writeYml(tmpDir, '.github/gitbuddy.yml', ': broken-indent:\n  bad');
      expect(() => new YamlConfigProvider(tmpDir)).toThrow(/Failed to parse/);
    });
    it('falls back to process.cwd() when configPath is null', async () => {
      writeYml(tmpDir, '.github/gitbuddy.yml', 'automation:\n  staleLabel: "original"\n');
      const provider = new YamlConfigProvider(tmpDir);

      // Manually clear the internal configPath so reload() hits the fallback branch
      (provider as any).configPath = null;

      // With no configPath, reload falls back to process.cwd() which is /
      // and has no config — should throw
      await expect(provider.reload()).rejects.toThrow(ConfigNotFoundError);
    });
  });
});
