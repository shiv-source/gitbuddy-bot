# Insights

Configure DORA metrics collection, CI flakiness detection, and weekly digests.

## Options

### `collectDoraMetrics`

**Type:** `boolean` | **Default:** `false`

When enabled, GitBuddy Bot collects DORA metrics (deployment frequency, lead time for changes, mean time to recovery, change failure rate) from your repos.

```yaml
insights:
  collectDoraMetrics: true
```

### `ciHealthThreshold`

**Type:** `number` | **Default:** `0.9`

Fraction (0.0–1.0) of CI runs that should pass. If the pass rate drops below this threshold, GitBuddy Bot flags flaky CI.

```yaml
insights:
  ciHealthThreshold: 0.85
```

### `weeklyDigestEnabled`

**Type:** `boolean` | **Default:** `false`

When enabled, generates and posts a weekly digest summarizing org activity, metrics, and alerts.

```yaml
insights:
  weeklyDigestEnabled: true
```

### `digestSchedule`

**Type:** `string` | **Default:** `"0 9 * * 1"`

Cron expression for when the weekly digest is generated. Default: every Monday at 9am UTC.

```yaml
insights:
  digestSchedule: "0 9 * * 5"   # Fridays at 9am UTC
```

### `metricsRetentionDays`

**Type:** `number` | **Default:** `90`

How long to retain DORA metrics data in the cache.

```yaml
insights:
  metricsRetentionDays: 180
```

## Full Example

```yaml
insights:
  collectDoraMetrics: true
  ciHealthThreshold: 0.85
  weeklyDigestEnabled: true
  digestSchedule: "0 9 * * 1"
  metricsRetentionDays: 90
```

## DORA Metrics Collected

| Metric | Description |
|--------|-------------|
| **Deployment Frequency** | How often deploys occur |
| **Lead Time for Changes** | Time from commit to production |
| **Mean Time to Recovery** | Time to recover from failures |
| **Change Failure Rate** | Percentage of deploys causing failures |
