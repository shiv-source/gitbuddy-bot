.PHONY: help install setup setup-ci graph-update graph-rebuild mcp-check mcp-register \
        build dev start test test-unit test-integration test-watch lint typecheck clean \
        docs-dev docs-build docs-deploy docs-typecheck docs-api

.DEFAULT_GOAL := help

# ── Help ────────────────────────────────────────────────────────────
# Uses ## comments on each target line to build the help output.
# Section headers are targets whose name starts with "_".

help: ## Show this help
	@echo "GitBuddy Bot — make targets"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@awk -F ':.*?## ' '/^[a-zA-Z0-9_-]+:.*?## / { \
		if ($$1 ~ /^_/) { \
			printf "\n  %s\n", $$2; \
		} else { \
			printf "  make %-22s %s\n", $$1, $$2; \
		} \
	}' $(MAKEFILE_LIST)
	@echo ""

# ── Targets ────────────────────────────────────────────────────────

_section_1: ## ── Setup ──

install: ## Install all workspace dependencies
	pnpm install

setup: ## Full team onboarding (uv, graphify, code-review-graph, MCP, graphs)
	@bash scripts/setup.sh

setup-ci: ## Team onboarding for CI (skips MCP registration)
	@bash scripts/setup.sh --ci

_section_2: ## ── Knowledge graphs ──

graph-update: ## Rebuild graphify graph (code-only, no LLM)
	graphify update .

graph-rebuild: ## Full rebuild of both knowledge graphs
	@echo "Building graphify graph..."
	@if [ -d graphify-out ]; then \
		graphify update .; \
	else \
		graphify extract . --wiki; \
	fi
	@echo ""
	@echo "Building code-review-graph..."
	@if command -v code-review-graph >/dev/null 2>&1; then \
		code-review-graph build; \
	elif command -v uvx >/dev/null 2>&1; then \
		uvx code-review-graph build; \
	else \
		echo "⚠ code-review-graph not found — install it first: make setup"; \
	fi

mcp-check: ## Verify both MCP servers are connected
	@claude mcp list 2>/dev/null || echo "⚠ claude CLI not on PATH"

mcp-register: ## Register graphify + code-review-graph MCP servers
	@if ! command -v claude >/dev/null 2>&1; then \
		echo "⚠ claude CLI not on PATH — cannot register MCP servers"; \
		exit 1; \
	fi
	claude mcp add graphify -- graphify-mcp graphify-out/graph.json 2>/dev/null || true
	claude mcp add code-review-graph -- uvx code-review-graph serve 2>/dev/null || true
	@echo ""
	claude mcp list 2>/dev/null

_section_3: ## ── App (./app) ──

build: ## Compile TypeScript (tsc)
	pnpm --filter './app' build

dev: ## Watch mode — recompiles on changes
	pnpm --filter './app' dev

start: ## Run the app (node dist/index.js)
	pnpm --filter './app' start

test: ## Run all tests with coverage
	pnpm --filter './app' test

test-unit: ## Run unit tests only
	pnpm --filter './app' test:unit

test-integration: ## Run integration tests only
	pnpm --filter './app' test:integration

test-watch: ## Jest watch mode (re-run on changes)
	pnpm --filter './app' test:watch

lint: ## ESLint over src/ and tests/
	pnpm --filter './app' lint

typecheck: ## TypeScript type checking — no emit
	pnpm --filter './app' typecheck

clean: ## Remove dist/ and coverage/
	pnpm --filter './app' clean

_section_4: ## ── Docs (./docs) ──

docs-dev: ## Start Docusaurus docs site locally
	pnpm --filter './docs' start

docs-build: ## Build static docs site
	pnpm --filter './docs' build

docs-deploy: ## Deploy docs to GitHub Pages
	pnpm --filter './docs' deploy

docs-typecheck: ## TypeScript check for docs site
	pnpm --filter './docs' typecheck

docs-api: ## Generate TypeDoc API reference
	pnpm --filter './docs' typedoc
