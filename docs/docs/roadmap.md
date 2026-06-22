# Roadmap

This document outlines the planned features and known issues for GitBuddy Bot. It is derived from the [open GitHub issues](https://github.com/shiv-source/gitbuddy-bot/issues) and organised by domain.

---

## Current State

| Area | Handlers | Commands | Status |
|------|----------|----------|--------|
| Governance | `governance.handler` | — | Auto-bootstrap repos, branch protection |
| Automation | `automation.handler` | `/shipit`, `/label`, `/triage` | Auto-label, PR checklists |
| Security | `security.handler` | — | Secret scanning alerts |
| Sync | `sync.handler` | — | Cross-repo workflow dispatch |
| Insights | `insights.handler` | — | DORA metrics collection |
| Copilot | `copilot.handler` | `@gitbuddy summarize` | PR review placeholder |
| Stale | `stale.handler` | — | Two-phase mark → close sweep |

**60 open issues**: 22 bugs + 38 enhancements across 7 domains.

---

## 🏛️ Governance

Goal: enforce org-wide standards and detect configuration drift.

| # | Feature | Status |
|---|---------|--------|
| [#2](https://github.com/shiv-source/gitbuddy-bot/issues/2) | Required file enforcement — ensure repos have `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `LICENSE` | planned |
| [#3](https://github.com/shiv-source/gitbuddy-bot/issues/3) | Branch naming convention — enforce patterns like `feature/*`, `bugfix/*`, `hotfix/*` | planned |
| [#4](https://github.com/shiv-source/gitbuddy-bot/issues/4) | CODEOWNERS compliance — verify every directory with >5 files has a CODEOWNER | planned |
| [#5](https://github.com/shiv-source/gitbuddy-bot/issues/5) | Repository settings drift detection — detect when settings diverge from org template | planned |
| [#6](https://github.com/shiv-source/gitbuddy-bot/issues/6) | MFA enforcement monitoring — flag org members without MFA enabled | planned |

---

## 🤖 Automation

Goal: reduce manual toil in PR and issue workflows.

| # | Feature | Status |
|---|---------|--------|
| [#7](https://github.com/shiv-source/gitbuddy-bot/issues/7) | PR size enforcement — flag/label PRs exceeding configurable line/diff limits | planned |
| [#8](https://github.com/shiv-source/gitbuddy-bot/issues/8) | Auto-request re-review — when new commits are pushed after a review, re-request reviewers | planned |
| [#9](https://github.com/shiv-source/gitbuddy-bot/issues/9) | Commit message convention — validate conventional commits format (`feat:`, `fix:`, etc.) | planned |
| [#10](https://github.com/shiv-source/gitbuddy-bot/issues/10) | Issue template enforcement — verify new issues use a template or close with a helpful comment | planned |
| [#11](https://github.com/shiv-source/gitbuddy-bot/issues/11) | Duplicate issue detection — detect similar issues via TF-IDF and suggest closing as duplicate | planned |
| [#12](https://github.com/shiv-source/gitbuddy-bot/issues/12) | Merge queue management — `/merge` command with FIFO queue, auto-update branches, conflict handling | planned |
| [#13](https://github.com/shiv-source/gitbuddy-bot/issues/13) | First-time contributor welcome — detect first PR/issue from a user and post a configurable welcome message | planned |

---

## 🔒 Security

Goal: catch leaks, enforce hygiene, and detect suspicious behaviour.

| # | Feature | Status |
|---|---------|--------|
| [#14](https://github.com/shiv-source/gitbuddy-bot/issues/14) | Push secret scanning — scan commit diffs for API keys, tokens, passwords using regex | planned |
| [#15](https://github.com/shiv-source/gitbuddy-bot/issues/15) | PAT rotation reminders — track personal access token expiry with escalating reminders | planned |
| [#16](https://github.com/shiv-source/gitbuddy-bot/issues/16) | Repository visibility change alerts — detect `repository.publicized` / `repository.privatized` | planned |
| [#17](https://github.com/shiv-source/gitbuddy-bot/issues/17) | Suspicious activity detection — bulk clone, outside collaborator, admin permission changes | planned |
| [#18](https://github.com/shiv-source/gitbuddy-bot/issues/18) | Dependency vulnerability scanning — check manifests against advisory databases on push | planned |

---

## 📊 Insights / DORA

Goal: provide DORA metrics and a single pane of glass for org health.

| # | Feature | Status |
|---|---------|--------|
| [#19](https://github.com/shiv-source/gitbuddy-bot/issues/19) | Deployment frequency metric — track from `deployment_status` events | planned |
| [#20](https://github.com/shiv-source/gitbuddy-bot/issues/20) | Mean Time to Recovery (MTTR) — track failure → recovery time per repo/environment | planned |
| [#21](https://github.com/shiv-source/gitbuddy-bot/issues/21) | Change failure rate — detect rollbacks and hotfixes as failed deployments | planned |
| [#22](https://github.com/shiv-source/gitbuddy-bot/issues/22) | Weekly org health digest — top repos, CI health, stale counts, DORA trends, security alerts | planned |
| [#23](https://github.com/shiv-source/gitbuddy-bot/issues/23) | CI flakiness detection — flag test suites with 5–50% failure rate, auto-open issues | planned |

---

## 🧠 Copilot / AI

Goal: actual LLM-powered PR review, description generation, and issue triage — the core value proposition.

| # | Feature | Status |
|---|---------|--------|
| [#24](https://github.com/shiv-source/gitbuddy-bot/issues/24) | Real AI PR review — fetch diff, send to LLM, post inline + summary review | planned |
| [#25](https://github.com/shiv-source/gitbuddy-bot/issues/25) | AI PR description generation — generate structured What/Why/How/Testing from diff + linked issue | planned |
| [#26](https://github.com/shiv-source/gitbuddy-bot/issues/26) | AI issue summarization — `@gitbuddy summarize` reads thread, posts concise summary + next steps | planned |
| [#27](https://github.com/shiv-source/gitbuddy-bot/issues/27) | AI label suggestion — suggest labels from repo's available set, 👍 to apply | planned |

---

## 🔗 Integrations

Goal: connect GitBuddy Bot to where teams actually work — Slack, Jira, Linear.

| # | Feature | Status |
|---|---------|--------|
| [#28](https://github.com/shiv-source/gitbuddy-bot/issues/28) | Slack notification integration — post security alerts, deploy status, digests to Slack | planned |
| [#29](https://github.com/shiv-source/gitbuddy-bot/issues/29) | Slack interactive commands — `/gitbuddy-shipit`, `/gitbuddy-triage` from Slack | planned |
| [#30](https://github.com/shiv-source/gitbuddy-bot/issues/30) | Jira/Linear sync — bidirectional issue status sync (GitHub ↔ Jira/Linear) | planned |

---

## ⚡ Release Management

Goal: automate changelogs, release notes, and semantic versioning discipline.

| # | Feature | Status |
|---|---------|--------|
| [#31](https://github.com/shiv-source/gitbuddy-bot/issues/31) | Automated changelog generation — collect merged PRs since last release, generate `CHANGELOG.md` | planned |
| [#32](https://github.com/shiv-source/gitbuddy-bot/issues/32) | Semantic version enforcement — validate version bumps match `major`/`minor`/`patch` labels | planned |
| [#33](https://github.com/shiv-source/gitbuddy-bot/issues/33) | Release note generation — generate structured release notes from merged PR titles + AI summaries | planned |

---

## 🏗️ Platform

Goal: production-grade infrastructure — DI, caching, health checks, replay, rate-limiting.

| # | Feature | Status |
|---|---------|--------|
| [#34](https://github.com/shiv-source/gitbuddy-bot/issues/34) | Redis cache backend — persist rate limits, DORA counters, stale progress across restarts | planned |
| [#35](https://github.com/shiv-source/gitbuddy-bot/issues/35) | Health check endpoint — `GET /health` with liveness, readiness, handler status, cache stats | planned |
| [#36](https://github.com/shiv-source/gitbuddy-bot/issues/36) | Webhook replay/recovery — dead-letter queue for failed events, `/replay` command | planned |
| [#37](https://github.com/shiv-source/gitbuddy-bot/issues/37) | Adaptive rate limiting — dynamically adjust concurrency based on GitHub API rate limit headers | planned |
| [#61](https://github.com/shiv-source/gitbuddy-bot/issues/61) | InversifyJS DI container — replace manual DI with IoC container, `IMiddleware` pipeline, `@inject()` decorators | planned |

---

## Known Bugs

### 🔴 Critical
| # | Bug | Impact |
|---|-----|--------|
| [#38](https://github.com/shiv-source/gitbuddy-bot/issues/38) | Rate limiter never releases acquired slots | Silent event loss after 10 events per type |
| [#39](https://github.com/shiv-source/gitbuddy-bot/issues/39) | Config is global, not per-repo | All repos share identical rules |
| [#40](https://github.com/shiv-source/gitbuddy-bot/issues/40) | 404 check broken after error wrapping | `getBranchProtection` never returns null |
| [#41](https://github.com/shiv-source/gitbuddy-bot/issues/41) | TOCTOU race condition in stale sweep | Label update can lose concurrent label changes |

### 🟠 High
| # | Bug | Impact |
|---|-----|--------|
| [#42](https://github.com/shiv-source/gitbuddy-bot/issues/42) | Invalid regex in governance handler crashes | Bad config pattern crashes handler |
| [#43](https://github.com/shiv-source/gitbuddy-bot/issues/43) | `/label -` produces empty label name | Entire command fails with API error |
| [#44](https://github.com/shiv-source/gitbuddy-bot/issues/44) | dispatchWorkflow errors not caught | One downstream failure blocks all others |

### 🟡 Medium · 9 issues · [#45](https://github.com/shiv-source/gitbuddy-bot/issues/45)–[#53](https://github.com/shiv-source/gitbuddy-bot/issues/53)
Label precedence bugs, error handling, retry backoff, rate-limit edge cases, config semantics, and stale sweep boundary conditions. See [all medium bugs](https://github.com/shiv-source/gitbuddy-bot/issues?q=is%3Aissue+is%3Aopen+label%3Abug).

### ⚪ Low · 7 issues · [#54](https://github.com/shiv-source/gitbuddy-bot/issues/54)–[#60](https://github.com/shiv-source/gitbuddy-bot/issues/60)
Async inconsistency, dead fields, error message formatting, and engine version requirements. See [all low bugs](https://github.com/shiv-source/gitbuddy-bot/issues?q=is%3Aissue+is%3Aopen+label%3Abug).

---

## Suggested Implementation Order

### Phase 1 — Stabilise (fix bugs first)
1. **#39** Per-repo config — foundational for all features
2. **#38** Rate limiter fix — prevents silent event loss
3. **#40** 404 check fix — unblocks governance handler
4. **#59** pnpm-workspace fix — ensures `pnpm install` works

### Phase 2 — Platform hardening
5. **#61** InversifyJS DI — cleaner architecture before more features
6. **#35** Health check endpoint — ops visibility
7. **#34** Redis cache — persistence across restarts
8. **#36** Webhook replay — disaster recovery

### Phase 3 — Core value features
9. **#24** Real AI PR review — main value prop
10. **#25** AI PR description generation
11. **#14** Push secret scanning
12. **#12** Merge queue management

### Phase 4 — Ecosystem
13. **#28** Slack notifications
14. **#30** Jira/Linear sync
15. **#22** Weekly org health digest
16. Remaining automation, governance, security, and DORA features

---

## Help Wanted

Issues tagged `help wanted` — great for external contributors:

- [#12](https://github.com/shiv-source/gitbuddy-bot/issues/12) Merge queue management
- [#17](https://github.com/shiv-source/gitbuddy-bot/issues/17) Suspicious activity detection
- [#22](https://github.com/shiv-source/gitbuddy-bot/issues/22) Weekly org health digest
- [#24](https://github.com/shiv-source/gitbuddy-bot/issues/24) Real AI PR review
- [#25](https://github.com/shiv-source/gitbuddy-bot/issues/25) AI PR description generation
- [#29](https://github.com/shiv-source/gitbuddy-bot/issues/29) Slack interactive commands
- [#30](https://github.com/shiv-source/gitbuddy-bot/issues/30) Jira/Linear sync
- [#36](https://github.com/shiv-source/gitbuddy-bot/issues/36) Webhook replay/recovery
- [#61](https://github.com/shiv-source/gitbuddy-bot/issues/61) InversifyJS DI container

## Good First Issues

Issues tagged `good first issue` — beginner-friendly:

- [#2](https://github.com/shiv-source/gitbuddy-bot/issues/2) Required file enforcement
- [#6](https://github.com/shiv-source/gitbuddy-bot/issues/6) MFA enforcement monitoring
- [#10](https://github.com/shiv-source/gitbuddy-bot/issues/10) Issue template enforcement
- [#13](https://github.com/shiv-source/gitbuddy-bot/issues/13) First-time contributor welcome
- [#16](https://github.com/shiv-source/gitbuddy-bot/issues/16) Repository visibility change alerts
- [#35](https://github.com/shiv-source/gitbuddy-bot/issues/35) Health check endpoint
