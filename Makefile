.PHONY: install build dev start test test-unit test-integration test-watch lint typecheck clean
.PHONY: graph-update graph-query graph-html graph-wiki

# ── Project ───────────────────────────────────────────────────────
# GitBuddy Bot — Probot GitHub App. Node ≥24, pnpm, TypeScript ESM.

install:
	pnpm install

build:
	pnpm run build

dev:
	pnpm run dev

start:
	pnpm start

test:
	pnpm test

test-unit:
	pnpm run test:unit

test-integration:
	pnpm run test:integration

test-watch:
	pnpm run test:watch

lint:
	pnpm run lint

typecheck:
	pnpm run typecheck

clean:
	pnpm run clean

# ── Graphify ──────────────────────────────────────────────────────
# graphify-out/ is checked in — clone and query immediately.
#
# After code changes:
#   make graph-update         ← AST-only incremental (zero API cost)
#
# After doc changes or new features:
#   /graphify . --update      ← full incremental (AST + semantic) — only
#                               changed files hit the LLM
#
# Query examples:
#   make graph-query Q="How does stale sweep work?"
#   make graph-query Q="Shortest path from EventContext to OctokitClient"

graph-update:
	@command -v graphify >/dev/null 2>&1 || { echo "Install: uv tool install graphifyy"; exit 1; }
	graphify update .

graph-query:
	@command -v graphify >/dev/null 2>&1 || { echo "Install: uv tool install graphifyy"; exit 1; }
	@test -f graphify-out/graph.json || { echo "No graph. Build with: /graphify ."; exit 1; }
	graphify query "$(Q)"

graph-html:
	graphify export html

graph-wiki:
	graphify export wiki
