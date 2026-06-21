# Automation

Configure issue/PR labeling, PR enforcement, stale management, and merge queue behavior.

## Options

### `defaultIssueLabels`

**Type:** `string[]` | **Default:** `["triage"]`

Labels automatically applied to new issues.

```yaml
automation:
  defaultIssueLabels: ["triage", "needs-review"]
```

### `staleAfterDays`

**Type:** `number` | **Default:** `60`

Number of days of inactivity before an issue is marked as stale.

```yaml
automation:
  staleAfterDays: 30
```

### `closeAfterDays`

**Type:** `number` | **Default:** `7`

Number of days after marking stale before an issue is closed. Total stale lifecycle = `staleAfterDays + closeAfterDays`.

```yaml
automation:
  closeAfterDays: 14
```

### `staleLabel`

**Type:** `string` | **Default:** `"stale"`

Label applied to stale issues. Also used to identify issues to close.

```yaml
automation:
  staleLabel: "stale"
```

### `exemptLabels`

**Type:** `string[]` | **Default:** `[]`

Issues with these labels are never marked stale.

```yaml
automation:
  exemptLabels: ["pinned", "security", "blocked"]
```

### `autoAssignOnCreate`

**Type:** `boolean` | **Default:** `false`

Automatically assign new issues to repository maintainers.

```yaml
automation:
  autoAssignOnCreate: true
```

### `prChecklistRequired`

**Type:** `boolean` | **Default:** `false`

Require a PR checklist to be completed before merging. Checks for `- [x]` items in the PR body.

```yaml
automation:
  prChecklistRequired: true
```

### `mergeQueueEnabled`

**Type:** `boolean` | **Default:** `false`

Enable merge queue support. When enabled, the `/merge` slash command queues PRs for sequential merging.

```yaml
automation:
  mergeQueueEnabled: true
```

## Full Example

```yaml
automation:
  defaultIssueLabels: ["triage", "needs-review"]
  staleAfterDays: 30
  closeAfterDays: 14
  staleLabel: "stale"
  exemptLabels: ["pinned", "security"]
  autoAssignOnCreate: true
  prChecklistRequired: true
  mergeQueueEnabled: false
```
