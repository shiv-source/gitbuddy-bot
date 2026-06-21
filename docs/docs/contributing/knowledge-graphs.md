---
sidebar_position: 6
---

# Knowledge Graphs

GitBuddy Bot maintains two complementary knowledge graphs that power AI-assisted development, code review, and architecture exploration. Both are **auto-rebuilt on every commit** — no manual steps needed after initial setup.

## Overview

| Graph | Tool | Purpose | Built by |
|-------|------|---------|----------|
| **Graphify** | `graphify` | Codebase knowledge graph: communities, god nodes, call paths, semantic search | Pre-commit hook |
| **Code Review Graph** | `code-review-graph` | Code review graph: risk analysis, impact radius, test coverage gaps | PostToolUse hook |

Both graphs live in the repo:
- Graphify output: `graphify-out/` (graph.json, graph.html, GRAPH_REPORT.md, wiki/)
- Code-review-graph output: `.code-review-graph/`

## One-Command Setup

```bash
make setup
```

`make setup` handles everything: installs `uv`, `graphify[mcp]`, `code-review-graph`, registers Claude Code MCP servers, installs pnpm dependencies, activates Husky git hooks, and builds both graphs.

For CI environments:

```bash
make setup-ci
```

Skips MCP server registration but installs everything else.

## Manual Setup (step by step)

### Prerequisites

```bash
# Python toolchain (required for graphify)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Restart your shell or source your profile, then:
uv tool install 'graphify[mcp]'      # graphify + MCP server
pipx install code-review-graph         # or: uvx code-review-graph (on-demand)
```

### Register MCP Servers

```bash
claude mcp add graphify -- graphify-mcp graphify-out/graph.json
claude mcp add code-review-graph -- uvx code-review-graph serve
```

Verify they're connected:

```bash
make mcp-check
# or: claude mcp list
```

Output:
```
graphify: graphify-mcp graphify-out/graph.json - ✔ Connected
code-review-graph: uvx code-review-graph serve - ✔ Connected
```

### Build Initial Graphs

```bash
# Graphify — if graphify-out/ exists (incremental, no API key):
graphify update .

# Graphify — if graphify-out/ doesn't exist (full + wiki, needs API key for docs):
graphify extract . --wiki

# Code-review-graph:
code-review-graph build
```

Or use the combined make target:

```bash
make graph-rebuild
```

## How Graphs Are Kept Current

### Pre-commit Hook (graphify)

Every `git commit` triggers `scripts/graphify-pre-commit.sh`:

1. Detects staged file changes via `git diff --name-only --cached`
2. Skips if only `graphify-out/` files changed (prevents loops)
3. Rebuilds the graph synchronously with `graphify.watch._rebuild_code()`
4. Runs `git add graphify-out/` to stage updated graph files into the **same commit**

Result: the knowledge graph is always in sync with your code — no separate "update graph" commit needed.

```bash
# Skip the hook for a single commit:
GRAPHIFY_SKIP_HOOK=1 git commit -m "temp: WIP"

# Disable permanently:
git config hooks.pre-commit false  # Husky-specific
```

### Post-checkout Hook (graphify)

When you switch branches, `scripts/graphify-post-checkout.sh` does a full rebuild:

1. Only fires on branch switches (not file checkouts)
2. Skips during rebase/merge/cherry-pick
3. Full rebuild (no `changed_paths` filter — branch switch can touch arbitrary files)

### PostToolUse Hook (code-review-graph)

After every Edit, Write, or Bash tool use, the code-review-graph is updated incrementally. Configured in `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write|Bash",
      "hooks": [{
        "type": "command",
        "command": "code-review-graph update --skip-flows --repo \"$(pwd)\""
      }]
    }]
  }
}
```

## Make Targets Reference

| Command | What it does |
|---------|-------------|
| `make setup` | Full team onboarding (interactive) |
| `make setup-ci` | Team onboarding for CI (skips MCP) |
| `make graph-update` | Incremental graphify rebuild (code-only, no LLM) |
| `make graph-rebuild` | Full rebuild of both graphs (graphify + code-review-graph) |
| `make mcp-check` | Verify both MCP servers are connected |
| `make mcp-register` | Register both MCP servers with Claude Code |

## Using the Graphs

### Graphify Queries

From Claude Code, use the `/graphify` skill or direct MCP tools:

```
/graphify query "how does the stale sweep work?"
/graphify path "StaleService" "GitHubClient"
/graphify explain "BaseHandler"
```

Or via the CLI:

```bash
graphify query "how does rate limiting work?"
graphify path "CommandRouter" "ICommand"
graphify explain "OctokitClient"
```

### Code-review-graph Analysis

From Claude Code, the graph tools are available via MCP:

- `detect_changes` — risk-scored code review
- `get_impact_radius` — blast radius analysis
- `query_graph` — trace callers, callees, imports, tests
- `get_architecture_overview` — high-level architecture summary

## Troubleshooting

### Graphify rebuild fails

```bash
# Force rebuild:
graphify update . --force

# Or via env var:
GRAPHIFY_FORCE=1 make graph-update
```

### "graphify not found"

```bash
# Check if graphify CLI is on PATH:
which graphify

# If not, reinstall:
uv tool install 'graphify[mcp]'

# Or use the pinned Python from graphify-out:
cat graphify-out/.graphify_python
```

### MCP server not connecting

```bash
# Check server health:
make mcp-check

# Re-register:
make mcp-register

# Verify the MCP command works directly:
graphify-mcp graphify-out/graph.json  # should start without errors
```

### Hook slows down commits

The pre-commit hook is synchronous by design (graph must be ready before commit finalizes). For large repos:

```bash
# Skip the hook for WIP commits:
GRAPHIFY_SKIP_HOOK=1 git commit -m "WIP: rough draft"

# Rebuild manually after:
make graph-update
```

### Windows / non-macOS setup

The hooks and scripts are POSIX-compatible and tested on macOS and Linux. For Windows, use Git Bash or WSL2.

## File Reference

```
scripts/
├── setup.sh                      # One-command team onboarding
├── graphify-pre-commit.sh        # Pre-commit: rebuild + stage graph
└── graphify-post-checkout.sh     # Post-checkout: rebuild on branch switch

.husky/
├── _/                            # Husky internal shim
├── pre-commit                    # → scripts/graphify-pre-commit.sh
└── post-checkout                 # → scripts/graphify-post-checkout.sh "$@"

graphify-out/                     # Graphify knowledge graph (tracked in git)
├── graph.json                    # Knowledge graph data
├── graph.html                    # Interactive visualization
├── GRAPH_REPORT.md               # Human-readable architecture report
├── wiki/                         # Per-community wiki pages
└── .graphify_python              # Pinned Python path (for hooks)
```
