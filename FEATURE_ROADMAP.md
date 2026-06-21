# Watchdog Pro — Feature Roadmap

## Current State: What's Already Built

| Domain | Implemented |
|---|---|
| **Governance** | Auto-bootstrap new repos with branch protection, audit & enforce branch protection rules |
| **Automation** | Default + regex rule-based labeling for issues/PRs, auto-assign reviewers from teams |
| **Security** | Log secret scanning alerts (alert channel placeholder), push commit event tracking |
| **Stale Management** | Two-phase sweep: mark stale → close, org-wide or per-repo, triggered by scheduled workflow |
| **Sync/Orchestration** | Cross-repo workflow dispatch on `workflow_run.completed`, deploy status notifications to integrations (Jira/Linear/Slack stubs) |
| **Insights/DORA** | CI check result tracking, PR lead-time calculation |
| **Copilot/AI** | AI PR description generation (placeholder), `@watchdog` mention response for AI review (placeholder) |
| **Commands** | `/shipit`, `/label`, `/triage` slash commands |
| **Infrastructure** | Octokit client w/ retry, YAML config, in-memory cache, Probot logger, rate limiter, context enricher, error handler |

---

## Feature Gap Analysis — Organized by Domain

### 1. 🏛️ Governance (extensions)

| # | Feature | Why | Complexity |
|---|---|---|---|
| 1 | **Required file enforcement** — Check repos for CONTRIBUTING.md, SECURITY.md, LICENSE, CODEOWNERS on creation; open issues if missing | Standardizes org hygiene | Low |
| 2 | **Branch naming convention enforcement** — Reject PRs whose head branch doesn't match configurable patterns (`feature/*`, `fix/*`, etc.) | Prevents messy git history | Medium |
| 3 | **CODEOWNERS compliance** — Auto-request review from CODEOWNERS for changed files; warn if no CODEOWNERS covers the diff | Enforces review policy | Medium |
| 4 | **Repository settings drift detection** — Periodic audit of all repo settings (visibility, wiki, issues, merge strategies) vs org policy; alert on drift | Catches config drift in large orgs | Medium |
| 5 | **MFA enforcement monitoring** — Periodically scan org members; alert/report users without MFA enabled | Security baseline for orgs | Low |

### 2. 🤖 Automation (extensions)

| # | Feature | Why | Complexity |
|---|---|---|---|
| 6 | **PR size enforcement** — Comment/warn on PRs exceeding configurable diff thresholds (lines changed, files touched); optionally block merges | Keeps PRs reviewable | Medium |
| 7 | **Auto-request re-review on push** — When new commits are pushed to an approved PR, dismiss stale reviews and re-request reviewers | Prevents merging un-reviewed code | Medium |
| 8 | **Commit message convention enforcement** — Validate commits follow conventional commits; post status check or comment on violations | Enforces changelog hygiene | Medium |
| 9 | **Issue template enforcement** — Detect issues opened without using a template; auto-close with a friendly message pointing to templates | Reduces noise issues | Low |
| 10 | **Duplicate issue detection** — Use fuzzy title matching to flag potential duplicates when a new issue is opened; comment with link to existing | Reduces duplicate work | Medium |
| 11 | **Merge queue management** — `/merge` command that enqueues PRs, auto-merges when CI passes, and auto-dequeues on conflicts | Coordinated merge workflow | High |
| 12 | **First-time contributor welcome** — Detect first-time contributors to a repo; post a welcome comment with contribution guide links | Improves community onboarding | Low |

### 3. 🔒 Security (extensions)

| # | Feature | Why | Complexity |
|---|---|---|---|
| 13 | **Push secret scanning** — Implement the `push` event handler to scan commit diffs for leaked secrets (API keys, tokens, passwords) using regex patterns; post alerts | Catches leaks before they propagate | Medium |
| 14 | **PAT rotation reminders** — Scan org for personal access tokens; post escalating reminders in issues as expiry approaches (90d → 30d → 7d → expired) | Prevents auth breakage | Medium |
| 15 | **Repository visibility change alerts** — Detect `repository.publicized` / `repository.privatized` events; post immediate alerts to security channel | Catches accidental exposure | Low |
| 16 | **Suspicious activity detection** — Monitor for unusual patterns: bulk clone activity, new outside collaborator added, admin permission changes; alert immediately | Early breach detection | High |
| 17 | **Dependency vulnerability scanning** — On `push` to default branch, check `package.json`/`requirements.txt`/`go.mod` against advisory DBs; open issues for critical vulns | Supply chain security | Medium |

### 4. 📊 Insights/DORA (extensions)

| # | Feature | Why | Complexity |
|---|---|---|---|
| 18 | **Deployment frequency metric** — Track deployments from `deployment_status` events; calculate daily/weekly/monthly deploy frequency per repo | Completes DORA quartet | Medium |
| 19 | **Mean Time to Recovery (MTTR)** — Track time from `deployment_status: failure` to next `deployment_status: success`; alert if MTTR exceeds threshold | Second DORA metric | Medium |
| 20 | **Change failure rate** — Track deployments that result in rollback or hotfix within N hours; calculate percentage over rolling windows | Third DORA metric | Medium |
| 21 | **Weekly org health digest** — Generate a summary issue/comment with: top repos by activity, CI health, stale issue counts, DORA trends, security alerts | Single pane of glass for managers | High |
| 22 | **CI flakiness detection** — Track check runs per test suite; flag suites where failure rate is between 5–50% (flaky, not truly broken); open issues | Actionable CI quality | Medium |

### 5. 🧠 Copilot/AI (extensions — flesh out the placeholders)

| # | Feature | Why | Complexity |
|---|---|---|---|
| 23 | **Real AI PR review** — Replace placeholder with actual Claude/GPT integration: fetch PR diff, run code review prompt, post inline or summary review | The main value prop | High |
| 24 | **Real AI PR description generation** — Fetch PR diff + linked issue; generate structured description (what, why, how, testing) via LLM; post as comment or update PR body | Saves author time | High |
| 25 | **AI issue summarization** — `@watchdog summarize` command → AI reads the thread and posts a concise summary + suggested next steps | Reduces catch-up time | Medium |
| 26 | **AI label suggestion** — On issue/PR open, use AI to suggest labels based on content (beyond regex rules); post suggestion comment | Smarter than regex alone | Medium |

### 6. 🔗 External Integrations

| # | Feature | Why | Complexity |
|---|---|---|---|
| 27 | **Slack notification integration** — Actually implement the `alertChannel` hook: post formatted security alerts, deploy status changes, digest summaries to Slack webhook | Real-time awareness | Medium |
| 28 | **Slack interactive commands** — Register Slack slash commands (`/wd-shipit`, `/wd-triage`) that proxy to the GitHub bot commands | Operate from chat | High |
| 29 | **Jira/Linear sync** — Actually implement the `sync.integrations` config: bi-directional issue status sync (GitHub issue closed → Jira ticket transitioned, and vice versa) | Cross-tool workflow | High |

### 7. ⚡ Release Management

| # | Feature | Why | Complexity |
|---|---|---|---|
| 30 | **Automated changelog generation** — On release/tag creation, collect merged PRs since last release, group by label, generate CHANGELOG.md entry; open PR or push commit | Release hygiene | Medium |
| 31 | **Semantic version enforcement** — When a PR is labeled `major`/`minor`/`patch`, validate that the version bump matches; auto-comment on mismatch | Versioning discipline | Medium |
| 32 | **Release note generation** — On release published, generate release notes from merged PR titles + AI summaries; update the GitHub Release body | Professional releases | Medium |

### 8. 🏗️ Platform / Reliability

| # | Feature | Why | Complexity |
|---|---|---|---|
| 33 | **Redis cache backend** — Implement `ICache` with Redis; persist rate limit state, stale sweep progress, and DORA counters across restarts | Production durability | Medium |
| 34 | **Health check endpoint** — Expose a `/health` HTTP endpoint returning app status, registered handlers, last event processed, cache stats | Operations visibility | Low |
| 35 | **Webhook replay/recovery** — Store raw webhook payloads in a dead-letter queue; expose ability to replay failed events | Disaster recovery | High |
| 36 | **Adaptive rate limiting** — Monitor GitHub API rate limit headers; dynamically adjust the per-event concurrency caps based on remaining quota | Smarter than static caps | Medium |

---

## Suggested Implementation Order

### Phase 1 — Quick Wins (Low effort, high impact)
- #9 — Issue template enforcement
- #12 — First-time contributor welcome
- #15 — Repository visibility change alerts
- #34 — Health check endpoint

### Phase 2 — Core Completeness (Medium effort, fills gaps)
- #1 — Required file enforcement
- #6 — PR size enforcement
- #13 — Push secret scanning (real implementation)
- #18 — Deployment frequency metric
- #27 — Slack notification integration
- #30 — Automated changelog generation

### Phase 3 — Advanced Capabilities (High effort, differentiators)
- #11 — Merge queue management
- #16 — Suspicious activity detection
- #21 — Weekly org health digest
- #23 — Real AI PR review
- #24 — Real AI PR description generation
- #29 — Jira/Linear sync

### Phase 4 — Production Hardening
- #33 — Redis cache backend
- #35 — Webhook replay/recovery
- #36 — Adaptive rate limiting

---

## Complexity Guide

| Level | Definition |
|---|---|
| **Low** | Single handler extension, ~50-150 lines, 1-2 test files. Good first issues. |
| **Medium** | New handler or service, ~200-500 lines, config changes, integration tests. |
| **High** | Multi-component feature, external API integration, new infrastructure, >500 lines. May need design review. |
