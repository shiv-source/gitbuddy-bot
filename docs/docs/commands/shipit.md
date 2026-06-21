# `/shipit`

Mark a PR as ready to ship. This command signals that the PR has passed review and is ready for merge.

## Usage

```
/shipit
```

## What It Does

1. Adds a `shipit` label to the PR
2. Posts a confirmation comment
3. If the merge queue is enabled, adds the PR to the merge queue

## Example

```
/shipit
```

**Response:**
> 🚢 Ship it! This PR has been marked as ready to merge.

## Requirements

- Command must be used in a PR comment
- User must have write access to the repo
- PR must not be in draft state
