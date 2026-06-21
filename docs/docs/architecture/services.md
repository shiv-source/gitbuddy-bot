# Services

Services contain **pure business logic** with no framework dependencies. They depend only on core interfaces (`ILogger`, `IGitHubClient`, `IConfigProvider`, `ICache`).

## StaleService

**File:** `src/services/stale.service.ts`

Implements the two-phase stale issue lifecycle:

### Phase 1 — Mark Stale

1. Queries open issues across the org (or single repo) that haven't been updated in `staleAfterDays` days
2. Excludes issues with `exemptLabels`
3. Applies the `staleLabel` and posts the `staleMessage` comment

### Phase 2 — Close Stale

1. Queries issues with the `staleLabel` that haven't been updated in `closeAfterDays` days
2. Closes those issues and posts the `closeMessage` comment

### Trigger

- **From `.github` repo**: Sweeps ALL repos in the org
- **From any other repo**: Sweeps only that repo
- Triggered by `workflow_run.completed` when the workflow name contains "stale-sweep" or "mark stale"

### Interface

```typescript
class StaleService {
  constructor(
    private readonly logger: ILogger,
    private readonly config: IConfigProvider,
  ) {}

  async sweepStale(repo: RepoRef): Promise<{ marked: number; closed: number }>;
  async markStale(client: IGitHubClient, repo: RepoRef): Promise<number>;
  async closeStale(client: IGitHubClient, repo: RepoRef): Promise<number>;
}
```

## Future Services

The architecture supports additional services for:
- **MergeQueueService** — Sequential PR merging with queue management
- **MetricsService** — DORA metrics calculation and aggregation
- **SyncService** — Cross-repo change propagation
- **SecurityScanService** — Secret detection and alerting

## Service Design Principles

1. **No framework imports** — Services import only from `src/core/`
2. **Interface dependencies** — Depend on `ILogger`, not `console`; `IGitHubClient`, not `Octokit`
3. **Single responsibility** — Each service does one thing well
4. **Testable in isolation** — Mock the interfaces, test the logic
