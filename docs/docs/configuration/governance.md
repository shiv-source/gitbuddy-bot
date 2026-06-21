# Governance

Configure branch protection enforcement, required files, and MFA rules.

## Options

### `autoBootstrapPatterns`

**Type:** `string[]` | **Default:** `[]`

Regex patterns matching repo names. When a new repo matching a pattern is created, GitBuddy Bot automatically bootstraps it with required files (CONTRIBUTING.md, LICENSE, SECURITY.md, etc.).

```yaml
governance:
  autoBootstrapPatterns: ["service-.*", "lib-.*", "tool-.*"]
```

### `requiredStatusChecks`

**Type:** `string[]` | **Default:** `[]`

Status checks that must pass before a PR can be merged. GitBuddy Bot enforces these via branch protection rules.

```yaml
governance:
  requiredStatusChecks: ["lint", "typecheck", "test", "security-codeql"]
```

### `requiredReviewCount`

**Type:** `number` | **Default:** `1`

Number of approving reviews required before a PR can be merged.

```yaml
governance:
  requiredReviewCount: 2
```

### `enforceMfa`

**Type:** `boolean` | **Default:** `false`

When enabled, GitBuddy Bot checks that all org members have MFA enabled and reports non-compliant accounts.

```yaml
governance:
  enforceMfa: true
```

### `requiredFiles`

**Type:** `string[]` | **Default:** `[]`

List of files that must exist in every repo. Used with `autoBootstrapPatterns` to ensure repos have standard files.

```yaml
governance:
  requiredFiles:
    - CONTRIBUTING.md
    - LICENSE
    - SECURITY.md
    - .github/CODEOWNERS
```

## Full Example

```yaml
governance:
  autoBootstrapPatterns: ["service-.*", "lib-.*"]
  requiredStatusChecks: ["lint", "typecheck", "test", "security-codeql"]
  requiredReviewCount: 1
  enforceMfa: true
  requiredFiles:
    - CONTRIBUTING.md
    - LICENSE
    - SECURITY.md
```
