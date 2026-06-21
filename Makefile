.PHONY: install build dev start test test-unit test-integration test-watch lint typecheck clean
.PHONY: docs-dev docs-build docs-deploy
.PHONY: graph-update graph-query graph-html graph-wiki

# ── Project ───────────────────────────────────────────────────────
# GitBuddy Bot — pnpm workspace monorepo. Node ≥24, TypeScript ESM.
#
#   app/    Probot GitHub App
#   docs/   Docusaurus site

install:
	pnpm install

build:
	pnpm --filter ./appbuild

dev:
	pnpm --filter ./appdev

start:
	pnpm --filter ./appstart

test:
	pnpm --filter ./apptest

test-unit:
	pnpm --filter ./apptest:unit

test-integration:
	pnpm --filter ./apptest:integration

test-watch:
	pnpm --filter ./apptest:watch

lint:
	pnpm --filter ./applint

typecheck:
	pnpm --filter ./apptypecheck

clean:
	pnpm --filter ./appclean

# ── Docs ──────────────────────────────────────────────────────────

docs-dev:
	pnpm --filter ./docsstart

docs-build:
	pnpm --filter ./docsbuild

docs-deploy:
	pnpm --filter ./docsdeploy

# ── Graphify ──────────────────────────────────────────────────────
# graphify-out/ is in the repo root.
#
# After code changes:
#   make graph-update         ← AST-only incremental (zero API cost)
#
# After doc changes or new features:
#   /graphify app/ --update   ← full incremental (AST + semantic) — only
#                               changed files hit the LLM
#
# Query examples:
#   make graph-query Q="How does stale sweep work?"
#   make graph-query Q="Shortest path from EventContext to OctokitClient"

graph-update:
	@command -v graphify >/dev/null 2>&1 || { echo "Install: uv tool install graphifyy"; exit 1; }
	graphify update app/

graph-query:
	@command -v graphify >/dev/null 2>&1 || { echo "Install: uv tool install graphifyy"; exit 1; }
	@test -f graphify-out/graph.json || { echo "No graph. Build with: /graphify app/"; exit 1; }
	graphify query "$(Q)"

graph-html:
	graphify export html

graph-wiki:
	graphify export wiki
