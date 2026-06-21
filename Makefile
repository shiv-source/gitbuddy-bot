.PHONY: help install build dev start test test-unit test-integration test-watch lint typecheck clean \
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

_section_2: ## ── App (./app) ──

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

_section_3: ## ── Docs (./docs) ──

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
