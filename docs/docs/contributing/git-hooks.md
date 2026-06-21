---
sidebar_position: 7
---

# Git Hooks

GitBuddy Bot uses [Husky](https://typicode.github.io/husky/) to manage git hooks portably. Hooks are tracked in version control and activated automatically on `pnpm install`.

## Why Husky?

- **Portable**: hooks live in `.husky/` (tracked in git), not `.git/hooks/` (local only)
- **Automatic**: `pnpm install` runs `husky` via the `prepare` script, setting `core.hooksPath`
- **Zero-config**: teammates get hooks the moment they clone and install
- **Standard**: the JS/TS ecosystem default for git hook management

## Hook Architecture

```
git commit
  → .husky/_/pre-commit          (Husky shim — auto-generated)
    → .husky/pre-commit           (2-line wrapper)
      → scripts/graphify-pre-commit.sh  (business logic)
```

Each `.husky/<hook-name>` file is a thin 2-line wrapper that delegates to a script in `scripts/`. The actual logic lives in `scripts/` where it's easy to read, edit, and review.

## Active Hooks

### Pre-commit (`scripts/graphify-pre-commit.sh`)

Fires on every `git commit`. Rebuilds the knowledge graph from staged changes and stages the results into the same commit.

**What it does:**

```
1. git diff --name-only --cached     → detects staged files
2. Skip if only graphify-out/ changed → prevents infinite loops
3. Skip during rebase/merge/cherry-pick → avoids blocking
4. Resolve Python with graphify       → 3-probe detection
5. Rebuild graph synchronously        → graphify.watch._rebuild_code()
6. git add graphify-out/              → stages results into commit
```

**Result:** The graph is always in sync with your code. No separate "update graph" commits needed.

**Graceful failure:** If the rebuild fails (no Python, missing graphify, timeout), the commit still proceeds. The hook exits 0 — it never blocks a commit.

```bash
# Skip the hook for one commit:
GRAPHIFY_SKIP_HOOK=1 git commit -m "WIP"

# Skip all hooks for one commit (Husky):
HUSKY=0 git commit -m "skip hooks"
```

### Post-checkout (`scripts/graphify-post-checkout.sh`)

Fires when you switch branches. Does a full graph rebuild since branch switches can touch arbitrary files.

**What it does:**

1. Only runs on branch switches (not `git checkout <file>`)
2. Only runs if `graphify-out/` exists (graph has been built before)
3. Skips during rebase/merge/cherry-pick
4. Full rebuild (no changed-files filter)

**Result:** The graph reflects the branch you just switched to.

## Python Detection

Both hooks use a portable 3-probe detection chain to find a Python interpreter with graphify installed:

```bash
# Probe 1: graphify-out/.graphify_python file
#   Written by the graphify CLI/skill on first build.
#   Survives uv tool reinstalls. Works even when CLI isn't on PATH.

# Probe 2: graphify CLI on PATH
#   Resolves shebang to find the actual Python interpreter.
#   Works for uv tool, pipx, and system installs.

# Probe 3: python3 / python on PATH
#   Fallback for system/venv installs.
#   Tries: python3 -c "import graphify", then python -c "import graphify"
```

No hardcoded paths — the hooks work on any machine where graphify is installed.

## Skipping Hooks

| Method | Scope | Command |
|--------|-------|---------|
| `GRAPHIFY_SKIP_HOOK=1` | Graphify only | `GRAPHIFY_SKIP_HOOK=1 git commit -m "msg"` |
| `HUSKY=0` | All Husky hooks | `HUSKY=0 git commit -m "msg"` |
| `--no-verify` | All git hooks | `git commit --no-verify -m "msg"` |
| Delete hook file | Permanently | `rm .husky/pre-commit` |

## Installation Details

### How Husky Gets Installed

1. `pnpm add -D husky -w` adds Husky to `devDependencies`
2. `pnpm exec husky init` creates `.husky/_/` (internal shim) and `.husky/pre-commit` (sample)
3. Husky adds `"prepare": "husky"` to `package.json` scripts
4. On every `pnpm install`, the `prepare` script runs `husky`, which sets `git config core.hooksPath .husky/_`

### How It Works on a Fresh Clone

```
git clone <repo>          → gets .husky/ directory
pnpm install              → prepare script runs husky
                          → core.hooksPath = .husky/_
git commit                → hooks are active
```

No manual steps needed. The hooks activate automatically.

## Verifying Hooks Are Active

```bash
# Check hooks path:
git config core.hooksPath
# Output: .husky/_  (Husky manages hooks)

# List active hooks:
ls .husky/
# Output: _/  pre-commit  post-checkout

# Test the pre-commit hook:
GRAPHIFY_SKIP_HOOK=1 git commit --allow-empty -m "test"
# Should show: [graphify hook] ... (skip guard, exit 0)
```

## Adding a New Hook

1. Create the logic script in `scripts/`:

```bash
#!/bin/sh
# scripts/my-hook.sh
echo "Running my custom check..."
# ... your logic here ...
```

2. Create the Husky wrapper:

```bash
#!/bin/sh
# .husky/pre-push
exec scripts/my-hook.sh "$@"
```

3. Make both executable:

```bash
chmod +x scripts/my-hook.sh .husky/pre-push
```

4. Commit both files — hooks are now active for everyone.

## Hook Timeouts

The pre-commit hook has a default timeout of 600 seconds (10 minutes) for graph rebuilds. You can adjust this:

```bash
# Set a shorter timeout:
GRAPHIFY_REBUILD_TIMEOUT=120 git commit -m "msg"

# Disable timeout (0 = no limit):
GRAPHIFY_REBUILD_TIMEOUT=0 git commit -m "msg"
```

The hook uses `signal.SIGALRM` to enforce the timeout. If the rebuild exceeds the limit, it exits gracefully and the commit proceeds anyway.
