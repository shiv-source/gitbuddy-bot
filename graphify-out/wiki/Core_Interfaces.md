# Core Interfaces

> 48 nodes · cohesion 0.08

## Key Concepts

- **interfaces.ts** (38 connections) — `app/src/core/interfaces.ts`
- **OctokitClient** (23 connections) — `app/src/infrastructure/github/octokit-client.ts`
- **octokit-client.ts** (18 connections) — `app/src/infrastructure/github/octokit-client.ts`
- **.withRetry()** (13 connections) — `app/src/infrastructure/github/octokit-client.ts`
- **app.ts** (13 connections) — `app/src/app.ts`
- **GitBuddyBotApp** (8 connections) — `app/src/app.ts`
- **ErrorHandler** (6 connections) — `app/src/middleware/error-handler.ts`
- **RateLimiter** (6 connections) — `app/src/middleware/rate-limiter.ts`
- **IEventHandler** (5 connections) — `app/src/core/interfaces.ts`
- **BranchProtection** (5 connections) — `app/src/core/types.ts`
- **rate-limiter.ts** (5 connections) — `app/src/middleware/rate-limiter.ts`
- **IssueSearchResult** (4 connections) — `app/src/core/interfaces.ts`
- **RepoInfo** (4 connections) — `app/src/core/interfaces.ts`
- **TeamMember** (4 connections) — `app/src/core/types.ts`
- **.createCheckRun()** (4 connections) — `app/src/infrastructure/github/octokit-client.ts`
- **CheckConclusion** (3 connections) — `app/src/core/interfaces.ts`
- **CheckDetails** (3 connections) — `app/src/core/interfaces.ts`
- **IssueUpdate** (3 connections) — `app/src/core/interfaces.ts`
- **PullRequestInfo** (3 connections) — `app/src/core/interfaces.ts`
- **.parseRetryAfter()** (3 connections) — `app/src/infrastructure/github/octokit-client.ts`
- **.updateBranchProtection()** (3 connections) — `app/src/infrastructure/github/octokit-client.ts`
- **.updateIssue()** (3 connections) — `app/src/infrastructure/github/octokit-client.ts`
- **.wrapError()** (3 connections) — `app/src/infrastructure/github/octokit-client.ts`
- **.constructor()** (3 connections) — `app/src/app.ts`
- **.addLabels()** (2 connections) — `app/src/infrastructure/github/octokit-client.ts`
- *... and 23 more nodes in this community*

## Relationships

- [[Command System]] (25 shared connections)
- [[Configuration & Errors]] (15 shared connections)
- [[Event Handlers]] (5 shared connections)
- [[Context Enrichment]] (4 shared connections)
- [[In-Memory Cache]] (2 shared connections)
- [[YAML Config Provider]] (1 shared connections)

## Source Files

- `app/src/app.ts`
- `app/src/core/interfaces.ts`
- `app/src/core/types.ts`
- `app/src/infrastructure/github/octokit-client.ts`
- `app/src/middleware/error-handler.ts`
- `app/src/middleware/rate-limiter.ts`

## Audit Trail

- EXTRACTED: 228 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*