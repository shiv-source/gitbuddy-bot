# GitHub Client Adapter

> 31 nodes · cohesion 0.11

## Key Concepts

- **OctokitClient** (23 connections) — `src/infrastructure/github/octokit-client.ts`
- **octokit-client.ts** (18 connections) — `src/infrastructure/github/octokit-client.ts`
- **.withRetry()** (13 connections) — `src/infrastructure/github/octokit-client.ts`
- **BranchProtection** (5 connections) — `src/core/types.ts`
- **IssueSearchResult** (4 connections) — `src/core/interfaces.ts`
- **RepoInfo** (4 connections) — `src/core/interfaces.ts`
- **TeamMember** (4 connections) — `src/core/types.ts`
- **.createCheckRun()** (4 connections) — `src/infrastructure/github/octokit-client.ts`
- **CheckConclusion** (3 connections) — `src/core/interfaces.ts`
- **CheckDetails** (3 connections) — `src/core/interfaces.ts`
- **IssueUpdate** (3 connections) — `src/core/interfaces.ts`
- **PullRequestInfo** (3 connections) — `src/core/interfaces.ts`
- **.parseRetryAfter()** (3 connections) — `src/infrastructure/github/octokit-client.ts`
- **.updateBranchProtection()** (3 connections) — `src/infrastructure/github/octokit-client.ts`
- **.updateIssue()** (3 connections) — `src/infrastructure/github/octokit-client.ts`
- **.wrapError()** (3 connections) — `src/infrastructure/github/octokit-client.ts`
- **.addLabels()** (2 connections) — `src/infrastructure/github/octokit-client.ts`
- **.createIssueComment()** (2 connections) — `src/infrastructure/github/octokit-client.ts`
- **.createPRComment()** (2 connections) — `src/infrastructure/github/octokit-client.ts`
- **.dispatchWorkflow()** (2 connections) — `src/infrastructure/github/octokit-client.ts`
- **.getBranchProtection()** (2 connections) — `src/infrastructure/github/octokit-client.ts`
- **.getPullRequest()** (2 connections) — `src/infrastructure/github/octokit-client.ts`
- **.getRepo()** (2 connections) — `src/infrastructure/github/octokit-client.ts`
- **.getTeamMembers()** (2 connections) — `src/infrastructure/github/octokit-client.ts`
- **.removeLabel()** (2 connections) — `src/infrastructure/github/octokit-client.ts`
- *... and 6 more nodes in this community*

## Relationships

- [[Slash Commands]] (9 shared connections)
- [[Configuration and Errors]] (4 shared connections)
- [[Handler Tests and Base]] (3 shared connections)
- [[Core Interfaces and Types]] (3 shared connections)
- [[Middleware Pipeline]] (2 shared connections)

## Source Files

- `src/core/interfaces.ts`
- `src/core/types.ts`
- `src/infrastructure/github/octokit-client.ts`

## Audit Trail

- EXTRACTED: 127 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*