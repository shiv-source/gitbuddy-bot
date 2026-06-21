---
sidebar_position: 1
---

# Configuration Overview

GitBuddy Bot reads its configuration from `.github/gitbuddy.yml` files using a fallback chain.

## Where to Place Config

1. **Repo-level**: `.github/gitbuddy.yml` in any repo — applies to that repo only
2. **Org-level**: `.github/gitbuddy.yml` in your org's `.github` repository — applies org-wide
3. **Defaults**: Built-in defaults when no config is specified

Config values are resolved via dot notation, with repo-level taking precedence over org-level, which takes precedence over defaults.

## Config File Format

```yaml
governance:
  # Branch protection, required files, MFA rules

automation:
  # Issue/PR labeling, stale management, merge queue

security:
  # Secret scanning, PAT reminders, alerts

sync:
  # Cross-repo config/source propagation

insights:
  # DORA metrics, CI flakiness, digests

copilot:
  # AI-powered PR review, description, label suggestion
```

Each top-level section is optional — GitBuddy Bot only activates domains that have configuration.

## Minimal Config

If you only want stale issue management:

```yaml
automation:
  staleAfterDays: 60
  closeAfterDays: 7
```

## Full Reference

See the [Configuration Reference](reference.md) for every key, type, default, and description.

## Programmatic Access

Handlers access config through the `IConfigProvider` interface:

```typescript
// Get a config value with dot notation and a fallback default
const staleDays = config.get('automation.staleAfterDays', 60);
const requiredChecks = config.get('governance.requiredStatusChecks', []);
const isEnabled = config.get('copilot.prReviewEnabled', false);
```

## Sections

- [Governance](governance.md) — Branch protection, required files, MFA enforcement
- [Automation](automation.md) — Labels, PR enforcement, stale management, merge queue
- [Security](security.md) — Secret scanning, PAT reminders, alerts
- [Stale Management](stale-management.md) — Two-phase stale sweep configuration
- [Insights](insights.md) — DORA metrics, CI flakiness detection, weekly digest
- [Copilot](copilot.md) — AI PR review, summarization, label suggestion
- [Integrations](integrations.md) — Slack, Jira, Linear webhooks
