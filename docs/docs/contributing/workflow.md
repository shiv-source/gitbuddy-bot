# Development Workflow

Branching, commit, and PR conventions for GitBuddy Bot.

## Branching

- Always branch from `main`
- Use descriptive branch names with prefixes:
  - `feat/<description>` — new features
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
make typecheck       # Must pass — no TypeScript errors
make test            # Must pass — all tests green
make lint            # Must pass — no lint warnings
```

These are enforced in CI. Fix issues before pushing.

### Knowledge Graph Auto-Rebuild

The pre-commit hook automatically rebuilds the knowledge graph from your staged changes and includes the updated graph files in your commit:

```
git commit
  → [graphify hook] rebuilding graph from staged changes...
  → [graphify hook] 3 file(s) staged — rebuilding graph...
  → [graphify watch] Rebuilt: 906 nodes, 1237 edges, 62 communities
  → [graphify hook] staged graphify-out/ into commit
  → commit created with everything — clean tree
```

No separate "update graph" commit needed. The graph is always in sync.

**Skipping the graph rebuild:**

```bash
# Skip for one commit:
GRAPHIFY_SKIP_HOOK=1 git commit -m "WIP: rough draft"

# Rebuild manually afterward:
make graph-update
```

See [Git Hooks](git-hooks.md) for full details on hook behavior and customization.

## Pull Requests

1. Push your branch: `git push -u origin feat/my-feature`
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
- **Graph health** — does the pre-commit hook still pass? Are graph files included?

## After Merge

- Delete your feature branch
- Pull `main`: `git checkout main && git pull`
- Run `make graph-update` if the pulled changes touched many files
