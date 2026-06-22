/**
 * Core abstractions for GitBuddy Bot.
 *
 * Every concrete dependency (Probot, Octokit, filesystem, cache backend)
 * hides behind one of these interfaces. Services and handlers depend on
 * interfaces, not implementations — the D in SOLID.
 */

import type { EventContext, HandlerResult, BranchProtection, TeamMember, GitBuddyConfig } from './types.js';

// ── Event Handler ─────────────────────────────────────────────
// S in SOLID: each handler has ONE reason to change — its domain.

export interface IEventHandler<TPayload = unknown> {
  /** Unique handler identifier (e.g. "governance", "automation") */
  readonly name: string;
  /** Probot event names this handler subscribes to */
  readonly events: string[];
  /** Process a webhook event. Must not throw — catch and return HandlerResult. */
  handle(context: EventContext<TPayload>): Promise<HandlerResult>;
}

// ── Logger ────────────────────────────────────────────────────
// ISP: narrow interface — only what logging needs.

export interface ILogger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, error?: Error, data?: Record<string, unknown>): void;
}

// ── GitHub Client ─────────────────────────────────────────────
// Adapter pattern: Octokit hides behind domain-named methods.
// Services never import Octokit directly.

export interface IGitHubClient {
  // Repos
  getRepo(owner: string, repo: string): Promise<RepoInfo>;
  createIssueComment(owner: string, repo: string, issueNumber: number, body: string): Promise<void>;
  addLabels(owner: string, repo: string, issueNumber: number, labels: string[]): Promise<void>;
  removeLabel(owner: string, repo: string, issueNumber: number, label: string): Promise<void>;

  // Pull Requests
  getPullRequest(owner: string, repo: string, prNumber: number): Promise<PullRequestInfo>;
  requestReviewers(owner: string, repo: string, prNumber: number, reviewers: string[]): Promise<void>;
  createPRComment(owner: string, repo: string, prNumber: number, body: string): Promise<void>;

  // Branch Protection
  getBranchProtection(owner: string, repo: string, branch: string): Promise<BranchProtection | null>;
  updateBranchProtection(owner: string, repo: string, branch: string, protection: BranchProtection): Promise<void>;

  // Teams
  getTeamMembers(org: string, teamSlug: string): Promise<TeamMember[]>;

  // Workflows
  dispatchWorkflow(owner: string, repo: string, workflowId: string, ref: string, inputs?: Record<string, string>): Promise<void>;

  // Checks
  createCheckRun(owner: string, repo: string, name: string, headSha: string, conclusion: CheckConclusion, details?: CheckDetails): Promise<void>;

  // Search
  searchRepos(query: string): Promise<RepoInfo[]>;

  // Issues — stale management
  /** Search issues in a repo. `since` filters by updated_at > date. */
  searchIssues(owner: string, repo: string, query: string, since?: Date): Promise<IssueSearchResult[]>;
  /** Update an issue (state, labels, etc.). Partial update. */
  updateIssue(owner: string, repo: string, issueNumber: number, update: IssueUpdate): Promise<void>;
}

export interface IssueSearchResult {
  number: number;
  title: string;
  state: 'open' | 'closed';
  labels: string[];
  updatedAt: string;
  url: string;
}

export interface IssueUpdate {
  state?: 'open' | 'closed';
  labels?: string[];
}

export interface RepoInfo {
  owner: string;
  repo: string;
  defaultBranch: string;
  isPrivate: boolean;
  archived: boolean;
}

export interface PullRequestInfo {
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed' | 'merged';
  author: string;
  baseRef: string;
  headRef: string;
  labels: string[];
  requestedReviewers: string[];
}

export type CheckConclusion = 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required';

export interface CheckDetails {
  title: string;
  summary: string;
  text?: string;
}

// ── Configuration Provider ─────────────────────────────────────

export interface IConfigProvider {
  /** Get the full parsed config */
  getConfig(): GitBuddyConfig;
  /** Get a nested config value by dot-notation path */
  get<T>(path: string, defaultValue: T): T;
  /** Reload config from source */
  reload(): Promise<void>;
}

// ── Cache ──────────────────────────────────────────────────────

export interface ICache {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
}

// ── Command ────────────────────────────────────────────────────
// Command pattern: each slash command is an ICommand.

export interface ICommand {
  /** The command name without slash (e.g. "shipit", "label") */
  readonly name: string;
  /** Brief description shown in help text */
  readonly description: string;
  /** Execute the command against an issue/PR comment */
  execute(context: CommandContext): Promise<CommandResult>;
}

export interface CommandContext {
  owner: string;
  repo: string;
  issueNumber: number;
  commentId: number;
  args: string[];
  sender: string;
  isPR: boolean;
  /** Per-event GitHub client for API calls */
  octokit: IGitHubClient;
}

export interface CommandResult {
  message: string;
  success: boolean;
}

// ── Middleware ──────────────────────────────────────────────────
// Lightweight marker interface for pipeline discovery and ordering.
// Each middleware class implements this plus its own domain-specific API.

export interface IMiddleware {
  /** Human-readable middleware name (e.g. "context-enricher") */
  readonly name: string;
  /**
   * Execution order — lower numbers run first.
   *   ContextEnricher: 100
   *   RateLimiter:     200
   *   ErrorHandler:    300
   */
  readonly priority: number;
}

// ── Command Router ──────────────────────────────────────────────

export interface ICommandRouter {
  register(command: ICommand): void;
  execute(
    body: string,
    baseContext: Omit<CommandContext, 'octokit'>,
    octokit: IGitHubClient,
  ): Promise<string | null>;
  listCommands(): Array<{ name: string; description: string }>;
}

// ── Stale Service ───────────────────────────────────────────────

export interface StaleSweepResult {
  /** Issues marked stale during this sweep */
  markedStale: number;
  /** Issues closed during this sweep */
  closed: number;
  /** Repos that were swept */
  reposSwept: number;
  /** Issues that failed processing */
  errors: number;
}

export interface IStaleService {
  sweepRepo(
    octokit: IGitHubClient,
    owner: string,
    repo: string,
    config: IConfigProvider,
  ): Promise<StaleSweepResult>;

  sweepOrg(
    octokit: IGitHubClient,
    org: string,
    config: IConfigProvider,
  ): Promise<StaleSweepResult>;
}

// ── Octokit Factory ─────────────────────────────────────────────
// Per-event IGitHubClient factory. Probot provides an installation-
// scoped Octokit on each webhook delivery; this factory wraps it
// in our domain adapter.

export interface IOctokitClientFactory {
  create(octokit: unknown): IGitHubClient;
}
