# `/merge`

Queue a PR for sequential merging. Requires `automation.mergeQueueEnabled: true`.

## Usage

```
/merge
```

## What It Does

1. Checks that the PR meets merge requirements (status checks, reviews, checklist)
2. If requirements are met, adds the PR to the merge queue
3. Posts the queue position in a comment
4. When the PR reaches the front of the queue, merges it and updates the comment

## Example

```
/merge
```

**Response:**
> 🔄 PR added to merge queue. Position: **3 of 5**.
> Estimated wait: 2–3 minutes.

## Merge Requirements

- All required status checks must pass
- Required review count must be met
- PR checklist must be complete (if `prChecklistRequired: true`)
- No merge conflicts with the base branch

## Queue Behavior

- PRs are merged sequentially to avoid conflicts
- If a merge fails (e.g., new conflicts), the PR is removed from the queue and the author is notified
- The queue processes one PR at a time

## Configuration

```yaml
automation:
  mergeQueueEnabled: true  # Required to use /merge
```
