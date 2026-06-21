## Description

<!-- Briefly describe what this PR does and why. Link any related issues. -->

Closes #

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Refactor / tech debt
- [ ] Documentation
- [ ] CI / tooling

## Affected Domains

<!-- Check the domain(s) this PR touches (see ARCHITECTURE.md or CLAUDE.md#architecture) -->

- [ ] Governance
- [ ] Automation
- [ ] Security scanning
- [ ] Cross-repo orchestration
- [ ] DORA insights
- [ ] AI copilot
- [ ] Core / infrastructure (interfaces, types, errors, adapters)
- [ ] Middleware
- [ ] Slash commands

## Checklist

- [ ] TypeScript compiles cleanly (`pnpm run typecheck`)
- [ ] Tests pass (`pnpm test`), including new tests for changed behavior
- [ ] Linter passes (`pnpm run lint`)
- [ ] New code follows existing patterns (extends `BaseHandler`, implements `ICommand`, depends on interfaces, etc.)
- [ ] No direct Octokit usage outside `src/infrastructure/` — use `IGitHubClient` instead
- [ ] Config access uses `IConfigProvider.get()` with dot notation and a fallback default
- [ ] New handlers are registered in `src/index.ts`

## Testing

<!-- How was this change tested? Manual verification, new unit/integration tests, etc. -->

## Screenshots / Logs (if applicable)
