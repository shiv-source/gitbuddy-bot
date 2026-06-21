# AI Copilot

Configure AI-powered features: PR review, description generation, and label suggestion.

:::caution Opt-in
All copilot features are **opt-in**. Set `prReviewEnabled: true` or `prDescriptionEnabled: true` to enable.
:::

## Options

### `prReviewEnabled`

**Type:** `boolean` | **Default:** `false`

When enabled, GitBuddy Bot automatically reviews new PRs and posts feedback as inline comments or a summary.

```yaml
copilot:
  prReviewEnabled: true
```

### `prDescriptionEnabled`

**Type:** `boolean` | **Default:** `true`

When enabled, GitBuddy Bot generates PR descriptions from the diff and commit messages.

```yaml
copilot:
  prDescriptionEnabled: true
```

### `labelSuggestionEnabled`

**Type:** `boolean` | **Default:** `false`

When enabled, GitBuddy Bot suggests labels for new issues and PRs based on content analysis.

```yaml
copilot:
  labelSuggestionEnabled: true
```

### `maxTokens`

**Type:** `number` | **Default:** `4096`

Maximum tokens for AI API calls. Higher values allow more context but cost more.

```yaml
copilot:
  maxTokens: 8192
```

### `model`

**Type:** `string` | **Default:** `"claude-sonnet-4-6"`

AI model to use for copilot features. Supported by the Anthropic API / Claude integration.

```yaml
copilot:
  model: "claude-opus-4-8"
```

### `reviewFocus`

**Type:** `string[]` | **Default:** `["bugs", "security", "style"]`

Categories the AI reviewer should focus on.

```yaml
copilot:
  reviewFocus: ["bugs", "security", "performance"]
```

## Full Example

```yaml
copilot:
  prReviewEnabled: false
  prDescriptionEnabled: true
  labelSuggestionEnabled: false
  maxTokens: 4096
  model: "claude-sonnet-4-6"
  reviewFocus: ["bugs", "security"]
```
