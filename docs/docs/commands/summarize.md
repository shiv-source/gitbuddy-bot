# `@gitbuddy summarize`

Generate an AI summary of an issue or PR using the configured AI model.

## Usage

```
@gitbuddy summarize
```

## What It Does

1. Analyzes the issue or PR body, comments, and linked context
2. Generates a concise summary using the configured AI model
3. Posts the summary as a comment

## Example

```
@gitbuddy summarize
```

**Response (posted as a comment):**
> **Summary:**
> This PR adds a `/merge` slash command that enables sequential PR merging via a merge queue. It introduces a `MergeCommand` implementing `ICommand`, a `MergeQueueService` for queue management, and config option `automation.mergeQueueEnabled`. The queue processes one PR at a time, validates merge requirements, and posts queue position updates.

## Requirements

- `copilot.prDescriptionEnabled: true` or `copilot.prReviewEnabled: true` must be set
- Command must be used in an issue or PR comment

## Configuration

```yaml
copilot:
  prDescriptionEnabled: true
  maxTokens: 4096
  model: "claude-sonnet-4-6"
```
