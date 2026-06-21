#!/usr/bin/env bash
# ==============================================================================
# GitBuddy Bot — Team Setup Script
# ==============================================================================
# Installs everything a teammate needs in one shot:
#   - uv (Python toolchain manager, required for graphify + code-review-graph)
#   - graphify (knowledge graph)
#   - code-review-graph (code-aware graph for AI-assisted review)
#   - pnpm dependencies + Husky git hooks
#   - Initial graph builds
#
# Usage:
#   ./scripts/setup.sh          # full install
#   ./scripts/setup.sh --ci     # CI mode: skip MCP registration, skip prompts
#   ./scripts/setup.sh --help   # show this message
# ==============================================================================

set -euo pipefail

# ── colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BOLD='\033[1m'; NC='\033[0m'
info()  { printf "${GREEN}✔${NC} %s\n" "$*"; }
warn()  { printf "${YELLOW}⚠${NC} %s\n" "$*"; }
err()   { printf "${RED}✘${NC} %s\n" "$*"; }
header(){ printf "\n${BOLD}━━━ %s ━━━${NC}\n" "$*"; }
check() { printf "  %s ... " "$*"; }

# ── flags ────────────────────────────────────────────────────────────────────
CI_MODE=false
case "${1:-}" in
    --ci)     CI_MODE=true ;;
    --help)   sed -n '2,/^$/p' "$0" | tail -n +3 | sed 's/^# \{0,1\}//'; exit 0 ;;
esac

# ── prerequisites ────────────────────────────────────────────────────────────
header "Checking prerequisites"

if ! command -v git >/dev/null 2>&1; then
    err "git is required but not installed — install it first: https://git-scm.com"
    exit 1
fi
info "git: $(git --version | head -1)"

_NODE_REQUIRED=$(node -e "process.stdout.write(require('./package.json').engines?.node || '>=18')" 2>/dev/null || echo ">=18")

if ! command -v node >/dev/null 2>&1; then
    err "Node.js $_NODE_REQUIRED is required — install it first: https://nodejs.org"
    exit 1
fi
info "node: $(node --version) (required: $_NODE_REQUIRED)"

_PNPM_REQUIRED=$(node -e "process.stdout.write(require('./package.json').engines?.pnpm || 'latest')" 2>/dev/null || echo "latest")

if ! command -v pnpm >/dev/null 2>&1; then
    warn "pnpm not found — installing via corepack (required: $_PNPM_REQUIRED)"
    corepack enable pnpm 2>/dev/null || npm install -g "pnpm@${_PNPM_REQUIRED}"
fi
info "pnpm: $(pnpm --version) (required: $_PNPM_REQUIRED)"

# ── uv ───────────────────────────────────────────────────────────────────────
header "Python toolchain (uv)"

if command -v uv >/dev/null 2>&1; then
    info "uv: $(uv --version 2>&1 | head -1)"
else
    check "installing uv"
    if $CI_MODE; then
        curl -LsSf https://astral.sh/uv/install.sh | sh
    else
        curl -LsSf https://astral.sh/uv/install.sh | sh
    fi
    # ensure uv is on PATH for the rest of this script
    export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"
    if command -v uv >/dev/null 2>&1; then
        info "uv: $(uv --version 2>&1 | head -1)"
    else
        err "uv installation succeeded but uv is not on PATH — add ~/.local/bin or ~/.cargo/bin to your PATH"
        exit 1
    fi
fi

# ── graphify ─────────────────────────────────────────────────────────────────
header "graphify (knowledge graph)"

# graphify is installed via uv tool. Detection order:
#   1. graphify CLI on PATH
#   2. uv tool installs (~/.local/share/uv/tools/graphifyy/bin/python3)
#   3. graphify-out/.graphify_python file (pinned path from prior install)
_GFY_FOUND=false
_GFY_PYTHON=""

# Probe 1: graphify CLI on PATH
if command -v graphify >/dev/null 2>&1; then
    _GFY_FOUND=true
    info "graphify: $(graphify --version 2>/dev/null || echo 'CLI found')"
fi

# Probe 2: uv-managed install
if ! $_GFY_FOUND; then
    _GFY_UV_PY="$HOME/.local/share/uv/tools/graphifyy/bin/python3"
    if [ -x "$_GFY_UV_PY" ] && "$_GFY_UV_PY" -c "import graphify" 2>/dev/null; then
        _GFY_FOUND=true
        _GFY_PYTHON="$_GFY_UV_PY"
        info "graphify: found via uv tools"
    fi
fi

# Probe 3: .graphify_python file
if ! $_GFY_FOUND && [ -f graphify-out/.graphify_python ]; then
    _GFY_FROM_FILE=$(cat graphify-out/.graphify_python 2>/dev/null | tr -d '[:space:]')
    if [ -n "$_GFY_FROM_FILE" ] && [ -x "$_GFY_FROM_FILE" ] && "$_GFY_FROM_FILE" -c "import graphify" 2>/dev/null; then
        _GFY_FOUND=true
        _GFY_PYTHON="$_GFY_FROM_FILE"
        info "graphify: found via graphify-out/.graphify_python"
    fi
fi

# Install if not found
if ! $_GFY_FOUND; then
    check "installing graphifyy via uv"
    uv tool install 'graphifyy[mcp]' 2>&1 || {
        err "graphify installation failed — check network or try: uv tool install 'graphifyy[mcp]'"
        exit 1
    }
    info "graphify: installed"
fi

# ── code-review-graph ────────────────────────────────────────────────────────
header "code-review-graph (code-aware review graph)"

# Try pipx first (isolated, clean), fall back to uvx (on-demand via MCP)
if command -v code-review-graph >/dev/null 2>&1; then
    info "code-review-graph: already installed ($(code-review-graph --version 2>/dev/null || echo 'version unknown'))"
elif command -v pipx >/dev/null 2>&1; then
    check "installing code-review-graph via pipx"
    pipx install code-review-graph 2>&1 || warn "pipx install failed — uvx will be used as fallback for MCP"
    command -v code-review-graph >/dev/null 2>&1 && info "code-review-graph: installed"
else
    warn "pipx not found — code-review-graph will run via uvx (on-demand, no CLI)"
    if ! $CI_MODE; then
        check "install pipx"
        if command -v brew >/dev/null 2>&1; then
            brew install pipx 2>/dev/null && pipx ensurepath 2>/dev/null || true
        elif command -v python3 >/dev/null 2>&1; then
            python3 -m pip install --user pipx 2>/dev/null || true
            python3 -m pipx ensurepath 2>/dev/null || true
        fi
        export PATH="$HOME/.local/bin:$PATH"
        if command -v pipx >/dev/null 2>&1; then
            pipx install code-review-graph 2>&1 && info "code-review-graph: installed via pipx"
        fi
    fi
fi

# ── Claude Code MCP servers ──────────────────────────────────────────────────
header "MCP server registration (Claude Code)"

_MCP_OK=true

if ! $CI_MODE && command -v claude >/dev/null 2>&1; then
    # --- graphify MCP ---
    if claude mcp list 2>/dev/null | grep -q 'graphify.*Connected'; then
        info "graphify MCP: already connected"
    else
        check "registering graphify MCP server"
        if claude mcp add graphify -- graphify-mcp graphify-out/graph.json 2>/dev/null; then
            info "graphify MCP: registered"
        else
            warn "could not auto-register graphify MCP — add manually:"
            warn "  claude mcp add graphify -- graphify-mcp graphify-out/graph.json"
            _MCP_OK=false
        fi
    fi

    # --- code-review-graph MCP ---
    if claude mcp list 2>/dev/null | grep -q 'code-review-graph.*Connected'; then
        info "code-review-graph MCP: already connected"
    else
        check "registering code-review-graph MCP server"
        # use uvx so it fetches the latest version automatically
        if claude mcp add code-review-graph -- uvx code-review-graph serve 2>/dev/null; then
            info "code-review-graph MCP: registered"
        else
            warn "could not auto-register code-review-graph MCP — add manually:"
            warn "  claude mcp add code-review-graph -- uvx code-review-graph serve"
            _MCP_OK=false
        fi
    fi

    # --- verify both connect ---
    echo ""
    check "testing MCP server connections"
    _MCP_OUT=$(claude mcp list 2>/dev/null || true)
    _GFY_CONN=$(echo "$_MCP_OUT" | grep -o 'graphify:.*✔ Connected' || true)
    _CRG_CONN=$(echo "$_MCP_OUT" | grep -o 'code-review-graph:.*✔ Connected' || true)

    if [ -n "$_GFY_CONN" ]; then
        info "graphify MCP: $_GFY_CONN"
    else
        warn "graphify MCP: not connected — restart Claude Code and re-run: claude mcp list"
        _MCP_OK=false
    fi

    if [ -n "$_CRG_CONN" ]; then
        info "code-review-graph MCP: $_CRG_CONN"
    else
        warn "code-review-graph MCP: not connected — restart Claude Code and re-run: claude mcp list"
        _MCP_OK=false
    fi

    if $_MCP_OK; then
        info "all MCP servers connected"
    fi
elif $CI_MODE; then
    info "MCP registration skipped (CI mode)"
else
    warn "claude CLI not on PATH — MCP servers must be registered manually:"
    warn "  claude mcp add graphify -- graphify-mcp graphify-out/graph.json"
    warn "  claude mcp add code-review-graph -- uvx code-review-graph serve"
fi

# ── Project dependencies + Husky hooks ────────────────────────────────────────
header "Project dependencies"

check "installing pnpm packages"
pnpm install --frozen-lockfile 2>&1 || pnpm install 2>&1
info "pnpm packages: installed"

# Husky's prepare script should have run automatically via pnpm install.
# Verify it set core.hooksPath correctly.
HOOKS_PATH=$(git config core.hooksPath 2>/dev/null || echo '')
if [ "$HOOKS_PATH" = ".husky/_" ] || [ "$HOOKS_PATH" = ".husky" ]; then
    info "git hooks: active (core.hooksPath = $HOOKS_PATH)"
else
    warn "git hooks may not be active — run: pnpm exec husky"
    pnpm exec husky 2>/dev/null || true
fi

# ── Build initial graphs ─────────────────────────────────────────────────────
header "Building knowledge graphs"

# --- graphify ---
if ! command -v graphify >/dev/null 2>&1; then
    warn "graphify CLI not found — skipping graph build"
else
    if [ -d "graphify-out" ]; then
        check "updating graphify knowledge graph (incremental)"
        graphify update . 2>&1 && info "graphify graph: updated" || {
            warn "graphify update failed — graph will be rebuilt by pre-commit hook"
        }
    else
        check "building graphify knowledge graph (full + wiki)"
        graphify extract . --wiki 2>&1 && info "graphify graph: built with wiki" || {
            warn "graphify extract failed — you may need an API key for doc files"
            warn "  Set GEMINI_API_KEY or ANTHROPIC_API_KEY and re-run: graphify extract . --wiki"
        }
    fi
fi

# --- code-review-graph ---
if command -v code-review-graph >/dev/null 2>&1; then
    check "building code-review-graph"
    code-review-graph build 2>/dev/null && info "code-review-graph: built" || {
        warn "code-review-graph build failed — run 'code-review-graph build' manually"
    }
elif command -v uvx >/dev/null 2>&1; then
    check "building code-review-graph (via uvx)"
    uvx code-review-graph build 2>/dev/null && info "code-review-graph: built" || {
        warn "code-review-graph build failed — run 'uvx code-review-graph build' manually"
    }
else
    warn "code-review-graph not available — run 'uvx code-review-graph build' after installing uv"
fi

# ── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  GitBuddy Bot — setup complete"
echo ""
echo "  What's installed:"
echo "    ✔ uv              — Python toolchain"
echo "    ✔ graphify        — knowledge graph (auto-rebuilds on commit)"
echo "    ✔ code-review-graph — AI code review graph"
echo "    ✔ pnpm packages   — project dependencies"
echo "    ✔ git hooks       — Husky-managed (pre-commit, post-checkout)"
echo ""
echo "  Next steps:"
echo "    • Restart Claude Code / your editor to pick up new MCP servers"
echo "    • The graph auto-rebuilds on every commit — no manual steps needed"
echo "    • To manually rebuild:  graphify update .   or   code-review-graph build"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
