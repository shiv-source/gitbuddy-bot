---
sidebar_position: 1
---

# Prerequisites

What you need before deploying GitBuddy Bot.

## Required

| Requirement | Details |
|-------------|---------|
| **Node.js ≥ 24** | Required for ESM and modern language features |
| **pnpm** | Package manager (`corepack enable` or `npm i -g pnpm`) |
| **GitHub Account** | To register the GitHub App |
| **A hosting platform** | Railway, Fly.io, Render, or any VPS with Node.js support |

## Recommended

| Item | Why |
|------|-----|
| **Custom domain** | `gitbuddy.your-org.com` for a professional endpoint |
| **Persistent storage** | For cache and metrics data across restarts |
| **Monitoring** | Uptime monitoring (Pingdom, Better Uptime, etc.) |
| **Log aggregation** | Papertrail, Logtail, or similar for centralized logs |

## GitHub App Permissions

The GitHub App needs these permissions scoped to your org:

| Permission | Level | Reason |
|------------|-------|--------|
| Issues | Read & write | Label, comment, close issues |
| Pull requests | Read & write | Review, comment, merge PRs |
| Contents | Read | Read config files, scan for secrets |
| Metadata | Read | Required by GitHub for all apps |
| Checks | Read & write | Read CI status, post check runs |
| Commit statuses | Read & write | Enforce required status checks |
| Administration | Read | Read branch protection rules |
| Members | Read | Check MFA status |

## Subscribe to Events

The GitHub App should subscribe to:
- `Issues` — opened, edited, deleted
- `Issue comment` — created
- `Pull request` — opened, edited, closed
- `Push` — for secret scanning and sync
- `Check run` — completed
- `Check suite` — completed
- `Workflow run` — completed
- `Deployment status` — for DORA metrics
- `Repository` — created
- `Branch protection rule` — created, edited, deleted

## Next Steps

- [GitHub App Setup](github-app-setup.md) — step-by-step app registration
- [Deployment](deployment.md) — deploy to your platform
