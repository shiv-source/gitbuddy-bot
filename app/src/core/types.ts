/**
 * Shared domain types used across all handlers and services.
 *
 * These are plain data structures — no Probot, no Octokit, no framework dependency.
 * Only exception: IGitHubClient is referenced (type-only) so EventContext can carry
 * the per-event authenticated client without handlers depending on Probot.
 */

import type { IGitHubClient } from './interfaces.js';

// ── Event Context ─────────────────────────────────────────────

/** Wrapper around Probot's context — keeps the framework at arm's length. */
export interface EventContext<TPayload = unknown> {
  /** Event name (e.g. "issues.opened", "pull_request.closed") */
  readonly name: string;
  /** Unique delivery ID from X-GitHub-Delivery header */
  readonly deliveryId: string;
  /** The webhook payload */
  readonly payload: TPayload;
  /** Repository nwo (owner/repo) extracted from the event */
  readonly repo: RepoRef;
  /** Organization login, if the event comes from an org repo */
  readonly org?: string;
  /** GitHub user login that triggered the event */
  readonly sender: string;
  /** Per-event authenticated GitHub client — set by middleware. Always available when a handler runs. */
  readonly octokit: IGitHubClient;
}

/** Lightweight repo reference — use instead of passing full payload around. */
export interface RepoRef {
  owner: string;
  repo: string;
}

// ── Handler Result ────────────────────────────────────────────

export interface HandlerResult {
  /** Human-readable summary of what happened */
  summary: string;
  /** Whether the handler took action (vs no-op) */
  actionTaken: boolean;
  /** Arbitrary metadata for logging */
  metadata?: Record<string, unknown>;
}

/** A handler that chose not to act. */
export const NO_ACTION: HandlerResult = {
  summary: 'No action required',
  actionTaken: false,
};

// ── Configuration ─────────────────────────────────────────────

export interface GitBuddyConfig {
  governance?: GovernanceConfig;
  automation?: AutomationConfig;
  security?: SecurityConfig;
  sync?: SyncConfig;
  insights?: InsightsConfig;
  copilot?: CopilotConfig;
}

export interface GovernanceConfig {
  /** Repos matching these patterns get auto-bootstrapped on creation */
  autoBootstrapPatterns: string[];
  /** Required status checks enforced on all protected branches */
  requiredStatusChecks: string[];
  /** Number of approving reviews required */
  requiredReviewCount: number;
}

export interface AutomationConfig {
  /** Labels applied to every new issue */
  defaultIssueLabels: string[];
  /** Patterns → label mapping for auto-labeling */
  labelRules: LabelRule[];
  /** Days before an issue is marked stale */
  staleAfterDays: number;
  /** Days before a stale issue is closed */
  closeAfterDays: number;
  /** Label applied to stale issues (default: "stale") */
  staleLabel: string;
}

export interface LabelRule {
  pattern: string;
  label: string;
}

export interface SecurityConfig {
  /** Alert channel (Slack webhook URL, email, etc.) */
  alertChannel?: string;
  /** Patterns to skip during secret scanning */
  excludePatterns: string[];
  /** Maximum PAT age in days before warning */
  maxPatAgeDays: number;
}

export interface SyncConfig {
  /** Map of repo → upstream repos to dispatch to */
  downstreamRepos: Record<string, string[]>;
  /** External integrations */
  integrations: IntegrationConfig[];
}

export interface IntegrationConfig {
  type: 'jira' | 'linear' | 'slack';
  enabled: boolean;
  config: Record<string, string>;
}

export interface InsightsConfig {
  /** Collect DORA metrics (deployment frequency, lead time, etc.) */
  collectDoraMetrics: boolean;
  /** Alert if CI success rate drops below this threshold (0–1) */
  ciHealthThreshold: number;
}

export interface CopilotConfig {
  /** Enable AI-powered PR review */
  prReviewEnabled: boolean;
  /** Enable AI-generated PR descriptions */
  prDescriptionEnabled: boolean;
  /** Max tokens per AI request */
  maxTokens: number;
}

// ── Branch Protection ────────────────────────────────────────

export interface BranchProtection {
  branch: string;
  requiredReviews: number;
  requiredStatusChecks: string[];
  enforceAdmins: boolean;
}

// ── Team / Assignee ───────────────────────────────────────────

export interface TeamMember {
  login: string;
  lastAssignedAt?: Date;
}
