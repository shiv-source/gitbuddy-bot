# `/label`

Apply labels to an issue or PR.

## Usage

```
/label <label1> <label2> ...
```

## What It Does

Applies the specified labels to the issue or PR. Creates labels if they don't exist in the repo.

## Examples

```bash
/label bug priority-high
/label documentation help-wanted
/label good-first-issue
```

**Response:**
> ✅ Applied labels: `bug`, `priority-high`

## Requirements

- Command must be used in an issue or PR comment
- User must have triage access or higher
- Labels must match repo conventions

## Aliases

- `/l` — shorthand for `/label`
