#!/bin/sh
# graphify — auto-rebuild knowledge graph on commit (code files only, no LLM needed).
# Pre-commit hook: rebuilds from staged changes, stages updated graph files into
# the same commit. Called by .husky/pre-commit (Husky-managed git hook).

# Deterministic clustering: networkx louvain iterates string-keyed sets whose
# order is randomized per-process by PYTHONHASHSEED, so community assignments
# churn run-to-run. Pinning it makes graphify-out reproducible.
export PYTHONHASHSEED=0

# Skip during rebase/merge/cherry-pick to avoid blocking --continue with unstaged changes
GIT_DIR=$(git rev-parse --git-dir 2>/dev/null)
[ -d "$GIT_DIR/rebase-merge" ] && exit 0
[ -d "$GIT_DIR/rebase-apply" ] && exit 0
[ -f "$GIT_DIR/MERGE_HEAD" ] && exit 0
[ -f "$GIT_DIR/CHERRY_PICK_HEAD" ] && exit 0

[ "${GRAPHIFY_SKIP_HOOK:-0}" = "1" ] && exit 0

# Detect staged changes (pre-commit uses --cached, not HEAD~1 vs HEAD)
CHANGED=$(git diff --name-only --cached 2>/dev/null)
if [ -z "$CHANGED" ]; then
    exit 0
fi

# Skip when only graphify-out/ artifacts are staged (avoids rebuild loop)
_NON_GRAPH=$(echo "$CHANGED" | grep -v '^graphify-out/' || true)
if [ -z "$_NON_GRAPH" ]; then
    exit 0
fi

# Detect the correct Python interpreter (handles uv tool, pipx, venv, system installs).
# Portable: no hardcoded paths — resolves from .graphify_python file, PATH, or system python.
GRAPHIFY_PYTHON=""

# Probe 1: read graphify-out/.graphify_python (written by the skill and CLI;
# survives uv-tool reinstalls and is the same source the README documents).
if [ -z "$GRAPHIFY_PYTHON" ]; then
    _GFY_PYTHON_FILE="graphify-out/.graphify_python"
    if [ -f "$_GFY_PYTHON_FILE" ]; then
        _FROM_FILE=$(cat "$_GFY_PYTHON_FILE" 2>/dev/null | tr -d '[:space:]')
        case "$_FROM_FILE" in
            *[!a-zA-Z0-9/_.@:\-]*) _FROM_FILE="" ;;  # allowlist (covers Windows paths)
        esac
        if [ -n "$_FROM_FILE" ] && [ -x "$_FROM_FILE" ] && "$_FROM_FILE" -c "import graphify" 2>/dev/null; then
            GRAPHIFY_PYTHON="$_FROM_FILE"
        fi
    fi
fi

# Probe 2: resolve via the graphify launcher on PATH (shebang probe).
if [ -z "$GRAPHIFY_PYTHON" ]; then
    GRAPHIFY_BIN=$(command -v graphify 2>/dev/null)
    if [ -n "$GRAPHIFY_BIN" ]; then
        case "$GRAPHIFY_BIN" in
            *.exe) _SHEBANG="" ;;
            *)     _SHEBANG=$(head -1 "$GRAPHIFY_BIN" | sed 's/^#![[:space:]]*//') ;;
        esac
        case "$_SHEBANG" in
            */env\ *) GRAPHIFY_PYTHON="${_SHEBANG#*/env }" ;;
            *)         GRAPHIFY_PYTHON="$_SHEBANG" ;;
        esac
        case "$GRAPHIFY_PYTHON" in
            *[!a-zA-Z0-9/_.@-]*) GRAPHIFY_PYTHON="" ;;
        esac
        if [ -n "$GRAPHIFY_PYTHON" ] && ! "$GRAPHIFY_PYTHON" -c "import graphify" 2>/dev/null; then
            GRAPHIFY_PYTHON=""
        fi
    fi
fi

# Probe 3: try python3 / python (works for system/venv installs on PATH).
if [ -z "$GRAPHIFY_PYTHON" ]; then
    if command -v python3 >/dev/null 2>&1 && python3 -c "import graphify" 2>/dev/null; then
        GRAPHIFY_PYTHON="python3"
    elif command -v python >/dev/null 2>&1 && python -c "import graphify" 2>/dev/null; then
        GRAPHIFY_PYTHON="python"
    else
        echo "[graphify hook] could not locate a Python with graphify installed. Add the graphify bin dir to PATH or run 'graphify hook install' from the env where graphify lives." >&2
        exit 0
    fi
fi

export GRAPHIFY_CHANGED="$CHANGED"

# Rebuild synchronously (pre-commit: must finish before commit proceeds).
# graphify's internal flock() prevents pile-ups if checkout + commit fire close together.
echo "[graphify hook] rebuilding graph from staged changes..."
"$GRAPHIFY_PYTHON" -c "
import os, signal, sys
from pathlib import Path

changed_raw = os.environ.get('GRAPHIFY_CHANGED', '')
changed = [Path(f.strip()) for f in changed_raw.strip().splitlines() if f.strip()]

if not changed:
    sys.exit(0)

print(f'[graphify hook] {len(changed)} file(s) staged — rebuilding graph...')

try:
    from graphify.watch import _rebuild_code, _apply_resource_limits
    _apply_resource_limits()
    _timeout = int(os.environ.get('GRAPHIFY_REBUILD_TIMEOUT', '600'))
    if _timeout > 0 and hasattr(signal, 'SIGALRM'):
        signal.signal(signal.SIGALRM, lambda *_: (_ for _ in ()).throw(TimeoutError(f'graphify rebuild exceeded {_timeout}s')))
        signal.alarm(_timeout)
    _force = os.environ.get('GRAPHIFY_FORCE', '').lower() in ('1', 'true', 'yes')
    _root = Path('.')
    _saved = Path('graphify-out/.graphify_root')
    if _saved.exists():
        _txt = _saved.read_text(encoding='utf-8').strip()
        if _txt:
            _root = Path(_txt)
    _rebuild_code(_root, changed_paths=changed, force=_force)
except TimeoutError as exc:
    print(f'[graphify hook] {exc}')
    sys.exit(1)
except Exception as exc:
    print(f'[graphify hook] Rebuild failed: {exc}')
    sys.exit(1)
"

REBUILD_EXIT=$?
if [ $REBUILD_EXIT -ne 0 ]; then
    echo "[graphify hook] rebuild failed (exit $REBUILD_EXIT) — commit will proceed anyway" >&2
    exit 0
fi

# Stage updated graph files into the current commit (so they never land as unstaged)
git add graphify-out/
echo "[graphify hook] staged graphify-out/ into commit"
