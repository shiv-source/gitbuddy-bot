# Development Workflow

Branching, commit, and PR conventions for GitBuddy Bot.

## Branching

- Always branch from `main`
- Use descriptive branch names:
  - `feature/<description>` — new features
  - `fix/<description>` — bug fixes
  - `docs/<description>` — documentation changes
  - `refactor/<description>` — code refactoring
  - `chore/<description>` — CI, tooling, dependencies
- Keep branches focused — one concern per branch

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <description>

feat: add /merge slash command with merge queue
fix: handle rate limit in stale sweep across large orgs
docs: add configuration reference for automation domain
refactor: extract StaleService from StaleHandler
test: add integration tests for governance handler
chore: update probot to v14.3.2
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

## Before Committing

```bash
pnpm run typecheck   # Must pass — no TypeScript errors
pnpm test            # Must pass — all tests green
pnpm run lint        # Must pass — no lint warnings
```

These are enforced in CI. Fix issues before pushing.

## Pull Requests

1. Push your branch: `git push -u origin feature/my-feature`
2. Open a PR on GitHub against `main`
3. Use the [PR template](https://github.com/shiv-source/gitbuddy-bot/blob/main/.github/pull_request_template.md)
4. Fill in:
   - Description and linked issues
   - Type of change
   - Affected domains (check the boxes)
   - Testing approach
5. Wait for CI to pass (typecheck, test, lint)
6. Request review from a maintainer

## Code Review

Reviewers look for:
- **Correctness** — does it do what it says?
- **Pattern adherence** — does it follow the existing architecture?
- **Interface usage** — no direct Octokit imports, no raw config parsing
- **Test coverage** — new behavior should have tests
- **Error handling** — proper use of `AppError` hierarchy

## After Merge

- Delete your feature branch
- Pull `main`: `git checkout main && git pull`
