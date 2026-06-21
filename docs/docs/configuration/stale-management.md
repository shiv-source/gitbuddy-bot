# Stale Management

Configure the two-phase stale issue lifecycle: mark stale → close.

## How It Works

The stale sweep runs on a schedule triggered by a GitHub Actions workflow. When the workflow completes:

1. **Phase 1 — Mark stale**: Issues inactive for `staleAfterDays` (and not exempt) get the stale label and a comment
2. **Phase 2 — Close**: Stale issues inactive for `closeAfterDays` after marking get closed

## Trigger Configuration

The sweep is triggered by `workflow_run.completed` events where the workflow name contains "stale-sweep" or "mark stale" (case-insensitive).

- **From `.github` repo**: Sweeps ALL repos in the org
- **From any other repo**: Sweeps only that repo

## Options

### `staleAfterDays`

**Type:** `number` | **Default:** `60`

Days of inactivity before marking as stale.

### `closeAfterDays`

**Type:** `number` | **Default:** `7`

Days after stale marking before closing.

### `staleLabel`

**Type:** `string` | **Default:** `"stale"`

Label applied to stale issues.

### `exemptLabels`

**Type:** `string[]` | **Default:** `[]`

Issues with these labels are never marked stale.

### `staleMessage`

**Type:** `string` | **Default:** See below

Custom message posted on stale issues.

```yaml
automation:
  staleMessage: |
    This issue has been marked as stale due to inactivity.
    It will be closed in {{closeAfterDays}} days if no further activity occurs.
```

### `closeMessage`

**Type:** `string` | **Default:** See below

Custom message posted when closing stale issues.

```yaml
automation:
  closeMessage: |
    This issue has been closed due to extended inactivity.
    Feel free to reopen if this is still relevant.
```

## Full Example

```yaml
automation:
  staleAfterDays: 60
  closeAfterDays: 7
  staleLabel: "stale"
  exemptLabels: ["pinned", "security", "blocked"]
  staleMessage: |
    👋 This issue has been marked as stale. It will be closed
    in {{closeAfterDays}} days if no further activity occurs.
  closeMessage: |
    🔒 This issue has been closed due to extended inactivity.
    Please reopen if still relevant.
```
