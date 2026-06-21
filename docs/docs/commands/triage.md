# `/triage`

Triage an issue with priority, assignment, and labeling.

## Usage

```
/triage [priority] [@assignee]
```

## What It Does

1. Assigns a priority label (`priority-low`, `priority-medium`, `priority-high`, `priority-critical`)
2. Optionally assigns the issue to a user
3. Removes the `triage` label (indicating the issue has been triaged)

## Examples

```bash
/triage high @jane
/triage medium
/triage critical @security-team
```

**Response:**
> 🔍 Triaged as `priority-high` and assigned to @jane.

## Priority Levels

| Level | Label | When to Use |
|-------|-------|-------------|
| `low` | `priority-low` | Nice to have, no urgency |
| `medium` | `priority-medium` | Should be done, not blocking |
| `high` | `priority-high` | Important, needs attention soon |
| `critical` | `priority-critical` | Urgent, blocking releases |

## Requirements

- Command must be used in an issue comment
- User must have triage access or higher
