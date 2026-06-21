# Core Interfaces

The TypeScript interfaces that define GitBuddy Bot's contract. All code depends on these abstractions.

> For auto-generated API documentation from JSDoc comments, run `pnpm run docs:api` (uses [TypeDoc](https://typedoc.org/)).

## IEventHandler

```typescript
// src/core/interfaces.ts
interface IEventHandler {
  name: string;
  events: string[];
  handle(context: EventContext): Promise<HandlerResult | typeof NO_ACTION>;
}
```

The contract for every domain handler. Each handler declares its name, the GitHub events it listens to, and a `handle` method.

## ILogger

```typescript
interface ILogger {
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
  debug(message: string, data?: Record<string, unknown>): void;
}
```

Abstracts logging. The concrete implementation (`ProbotLogger`) wraps Probot's logger. Swap for any logger by implementing this interface.

## IGitHubClient

```typescript
interface IGitHubClient {
  addLabels(params: AddLabelsParams): Promise<void>;
  removeLabel(params: RemoveLabelParams): Promise<void>;
  createComment(params: CreateCommentParams): Promise<void>;
  requestReviewers(params: RequestReviewersParams): Promise<void>;
  getBranchProtection(params: RepoRef): Promise<BranchProtection | null>;
  getFileContents(params: RepoRef & { path: string }): Promise<string | null>;
  createFile(params: CreateFileParams): Promise<void>;
  searchIssues(query: string): Promise<SearchIssuesResult>;
  closeIssue(params: CloseIssueParams): Promise<void>;
  // ... additional domain-named methods
}
```

Domain-named methods abstracting the GitHub API. The concrete implementation (`OctokitClient`) wraps Octokit with retry logic and rate-limit handling. **Handlers and services never import Octokit directly.**

## IConfigProvider

```typescript
interface IConfigProvider {
  get<T>(path: string, defaultValue: T): T;
  getRepoConfig(owner: string, repo: string): Promise<GitBuddyConfig>;
  refresh(): Promise<void>;
}
```

Configuration provider with dot-notation access and fallback defaults. The concrete implementation (`YamlConfigProvider`) reads `.github/gitbuddy.yml` with the fallback chain (repo → org → defaults).

## ICache

```typescript
interface ICache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}
```

Key-value cache with optional TTL. The concrete implementation (`MemoryCache`) is an in-memory store. Swap for Redis by implementing this interface.

## ICommand

```typescript
interface ICommand {
  name: string;
  description: string;
  execute(context: EventContext): Promise<HandlerResult>;
}
```

Contract for slash commands. Each command has a name (e.g., `/shipit`), a description, and an `execute` method.

## Key Types

### EventContext

```typescript
// src/core/types.ts
interface EventContext {
  octokit: IGitHubClient;
  event: string;
  payload: ProbotPayload;
  repo: RepoRef;
  org: string;
  sender: string;
  config: GitBuddyConfig;
}
```

### RepoRef

```typescript
interface RepoRef {
  owner: string;
  repo: string;
}
```

### HandlerResult

```typescript
interface HandlerResult {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
}
```

### NO_ACTION

```typescript
const NO_ACTION = Symbol('no_action');
```

Returned by handlers when they decide an event doesn't need processing.

### GitBuddyConfig

```typescript
interface GitBuddyConfig {
  governance?: GovernanceConfig;
  automation?: AutomationConfig;
  security?: SecurityConfig;
  sync?: SyncConfig;
  insights?: InsightsConfig;
  copilot?: CopilotConfig;
  integrations?: IntegrationsConfig;
}
```

See the [Configuration Reference](../configuration/reference.md) for the full schema of each sub-config.

## AppError Hierarchy

```typescript
// src/core/errors.ts
class AppError extends Error {
  code: string;
  statusCode: number;
  retryable: boolean;
}

class ConfigError extends AppError { /* ... */ }
class ConfigNotFoundError extends ConfigError { /* ... */ }
class ValidationError extends AppError { /* ... */ }
class RateLimitError extends AppError { /* ... */ }
class GitHubApiError extends AppError { /* ... */ }
class NotFoundError extends GitHubApiError { /* ... */ }
class HandlerError extends AppError { /* ... */ }
```

The error handler middleware classifies errors based on this hierarchy to decide whether to retry, report to the user, or log and swallow.
